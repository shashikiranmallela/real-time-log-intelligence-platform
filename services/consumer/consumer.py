from kafka import KafkaConsumer
from elasticsearch import Elasticsearch
import json
import statistics
import uuid
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL", "")

es = Elasticsearch("http://localhost:9200")

TEAM_MAPPING = {
    "auth-service":    "Authentication Team",
    "payment-service": "Payments Team",
    "order-service":   "Orders Team",
}

last_alert_time = {}

consumer = KafkaConsumer(
    "application-logs",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="log-intelligence-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
)

print("Starting Kafka Consumer with Anomaly Detection...")

response_times = []
error_counts = {
    "payment-service": 0,
    "auth-service":    0,
    "order-service":   0,
}


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def should_create_alert(service: str, alert_type: str) -> bool:
    key          = f"{service}_{alert_type}"
    current_time = datetime.now().timestamp()
    if key not in last_alert_time:
        last_alert_time[key] = current_time
        return True
    if current_time - last_alert_time[key] > 60:
        last_alert_time[key] = current_time
        return True
    return False


def send_slack_alert(alert: dict):
    """Send a Slack notification for a new alert. No-ops if webhook not configured."""
    if not SLACK_WEBHOOK:
        return

    sev       = (alert.get("severity") or "warn").upper()
    sev_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}.get(sev, "⚠️")

    payload = {
        "text": f"{sev_emoji} *New Alert — {sev}*",
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"{sev_emoji} Alert Detected — {sev}"},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Service:*\n{alert.get('service', '—')}"},
                    {"type": "mrkdwn", "text": f"*Team:*\n{alert.get('team', '—')}"},
                    {"type": "mrkdwn", "text": f"*Event:*\n{alert.get('message', '—')}"},
                    {"type": "mrkdwn", "text": f"*Time:*\n{alert.get('timestamp', '—')}"},
                ],
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": "Phantom Log Intelligence · auto-routed alert"}
                ],
            },
        ],
    }

    try:
        resp = requests.post(SLACK_WEBHOOK, json=payload, timeout=5)
        print(f"Slack alert sent: HTTP {resp.status_code}")
    except Exception as e:
        print(f"Slack send failed: {e}")


# ──────────────────────────────────────────────
# MAIN CONSUME LOOP
# ──────────────────────────────────────────────

for message in consumer:
    log = message.value

    print("\nReceived Log:")
    print(log)

    # ── Store log in Elasticsearch ──
    try:
        es.index(index="logs", document=log)
        print("Stored in Elasticsearch")
    except Exception as e:
        print(f"Elasticsearch Error: {e}")

    response_time = log.get("response_time", 0)
    response_times.append(response_time)
    if len(response_times) > 20:
        response_times.pop(0)

    # ── Response-time anomaly (z-score) ──
    if len(response_times) >= 5:
        mean  = statistics.mean(response_times)
        stdev = statistics.stdev(response_times)

        if stdev > 0:
            z_score = (response_time - mean) / stdev
            print(f"Z-Score: {z_score:.2f}")

            if z_score > 1.3:
                if should_create_alert(log["service"], "high_response_time"):
                    print("HIGH RESPONSE TIME ALERT")
                    alert = {
                        "incident_id":  str(uuid.uuid4()),
                        "timestamp":    log.get("timestamp"),
                        "severity":     "HIGH",
                        "status":       "OPEN",
                        "service":      log["service"],
                        "team":         TEAM_MAPPING.get(log["service"], "Unknown Team"),
                        "owner":        None,
                        "message":      "High Response Time Detected",
                        "response_time": response_time,
                    }
                    es.index(index="alerts", document=alert)
                    send_slack_alert(alert)
                    print(f"Alert Routed To: {alert['team']}")

    # ── Error-spike detection ──
    if log.get("level") == "ERROR":
        service = log["service"]
        error_counts[service] = error_counts.get(service, 0) + 1

        if error_counts[service] >= 3:
            if should_create_alert(service, "error_spike"):
                print(f"Error Spike in {service}")
                alert = {
                    "incident_id": str(uuid.uuid4()),
                    "timestamp":   log.get("timestamp"),
                    "severity":    "MEDIUM",
                    "status":      "OPEN",
                    "service":     service,
                    "team":        TEAM_MAPPING.get(service, "Unknown Team"),
                    "owner":       None,
                    "message":     f"Error Spike Detected in {service}",
                }
                es.index(index="alerts", document=alert)
                send_slack_alert(alert)
                print(f"Alert Routed To: {alert['team']}")

    # ── Debug output ──
    if response_time > 4000 or log.get("level") == "ERROR":
        print(f"Service: {log['service']}")
        print(f"Message: {log['message']}")
        print(f"Response Time: {response_time} ms")
        print("\nCurrent Error Counts:")
        for svc, count in error_counts.items():
            print(f"  {svc}: {count}")

    print("-" * 60)
