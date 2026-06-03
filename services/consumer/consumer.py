from kafka import KafkaConsumer
from elasticsearch import Elasticsearch
import json
import statistics
import uuid
from datetime import datetime

# Connect to Elasticsearch
es = Elasticsearch("http://localhost:9200")

# Team Routing Mapping
TEAM_MAPPING = {
    "auth-service": "Authentication Team",
    "payment-service": "Payments Team",
    "order-service": "Orders Team"
}

# Prevent duplicate alerts
last_alert_time = {}

# Kafka Consumer
consumer = KafkaConsumer(
    "application-logs",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="log-intelligence-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

print("Starting Kafka Consumer with Anomaly Detection...")

# Store response times
response_times = []

# Track error counts
error_counts = {
    "payment-service": 0,
    "auth-service": 0,
    "order-service": 0
}


# -----------------------------------
# DUPLICATE ALERT PREVENTION
# -----------------------------------

def should_create_alert(service, alert_type):

    key = f"{service}_{alert_type}"

    current_time = datetime.now().timestamp()

    if key not in last_alert_time:
        last_alert_time[key] = current_time
        return True

    if current_time - last_alert_time[key] > 60:
        last_alert_time[key] = current_time
        return True

    return False


# -----------------------------------
# PROCESS LOGS
# -----------------------------------

for message in consumer:

    log = message.value

    print("\nReceived Log:")
    print(log)

    # -----------------------------
    # STORE LOG
    # -----------------------------

    try:

        es.index(
            index="logs",
            document=log
        )

        print("Stored in Elasticsearch")

    except Exception as e:

        print("Elasticsearch Error:")
        print(e)

    # -----------------------------
    # RESPONSE TIME ANOMALY
    # -----------------------------

    response_time = log["response_time"]

    response_times.append(response_time)

    if len(response_times) > 20:
        response_times.pop(0)

    if len(response_times) >= 5:

        mean = statistics.mean(response_times)
        stdev = statistics.stdev(response_times)

        if stdev > 0:

            z_score = (response_time - mean) / stdev

            print(f"Z-Score: {z_score:.2f}")

            if z_score > 1.3:

                if should_create_alert(
                    log["service"],
                    "high_response_time"
                ):

                    print("HIGH RESPONSE TIME ALERT")

                    alert = {
                        "incident_id": str(uuid.uuid4()),
                        "timestamp": log["timestamp"],
                        "severity": "HIGH",
                        "status": "OPEN",
                        "service": log["service"],
                        "team": TEAM_MAPPING.get(
                            log["service"],
                            "Unknown Team"
                        ),
                        "owner": None,
                        "message": "High Response Time Detected",
                        "response_time": response_time
                    }

                    es.index(
                        index="alerts",
                        document=alert
                    )

                    print(
                        f"Alert Routed To: {alert['team']}"
                    )

    # -----------------------------
    # ERROR SPIKE DETECTION
    # -----------------------------

    if log["level"] == "ERROR":

        service = log["service"]

        error_counts[service] += 1

        if error_counts[service] >= 3:

            if should_create_alert(
                service,
                "error_spike"
            ):

                print(f"Error Spike in {service}")

                alert = {
                    "incident_id": str(uuid.uuid4()),
                    "timestamp": log["timestamp"],
                    "severity": "MEDIUM",
                    "status": "OPEN",
                    "service": service,
                    "team": TEAM_MAPPING.get(
                        service,
                        "Unknown Team"
                    ),
                    "owner": None,
                    "message": f"Error Spike Detected in {service}"
                }

                es.index(
                    index="alerts",
                    document=alert
                )

                print(
                    f"Alert Routed To: {alert['team']}"
                )

    # -----------------------------
    # DEBUG OUTPUT
    # -----------------------------

    if (
        response_time > 4000
        or log["level"] == "ERROR"
    ):

        print(f"Service: {log['service']}")
        print(f"Message: {log['message']}")
        print(f"Response Time: {response_time} ms")

        print("\nCurrent Error Counts:")

        for service, count in error_counts.items():
            print(f"{service}: {count}")

    print("-" * 60)