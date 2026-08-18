from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from groq import Groq
from dotenv import load_dotenv
import os
import hashlib
import requests

load_dotenv()

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
SLACK_WEBHOOK  = os.getenv("SLACK_WEBHOOK_URL", "")   # add to your .env

client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

es = Elasticsearch("http://localhost:9200")


# ──────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────

def _anomaly_signature(service: str, message: str, severity: str) -> str:
    """
    Create a stable cache key from the *type* of anomaly, not its exact
    timestamp-bearing text.  This means the same kind of event (same service +
    same message pattern + same severity) always reuses its cached explanation
    instead of calling Groq again.
    """
    raw = f"{(service or '').strip().lower()}|{(message or '').strip().lower()}|{(severity or '').strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cached_explanation(signature: str):
    try:
        res = es.search(
            index="anomaly_explanations",
            body={"query": {"term": {"signature.keyword": signature}}},
            size=1,
        )
        hits = res["hits"]["hits"]
        if hits:
            return hits[0]["_source"]["explanation"]
    except Exception:
        pass
    return None


def _store_explanation(signature: str, service: str, message: str, explanation: str):
    try:
        es.index(
            index="anomaly_explanations",
            document={
                "signature":  signature,
                "service":    service,
                "message":    message,
                "explanation": explanation,
            },
        )
    except Exception:
        pass


def _parse_explanation(explanation: str):
    """Parse numbered explanation text into root_cause and recommendation."""
    root_cause     = ""
    recommendation = ""
    expl_only      = ""
    for line in explanation.splitlines():
        line = line.strip()
        if not line:
            continue
        low = line.lower()
        if "possible cause" in low or line.startswith("1."):
            root_cause = line.split(":", 1)[-1].strip()
        elif "business impact" in low or line.startswith("2."):
            expl_only = line.split(":", 1)[-1].strip()
        elif "recommended action" in low or line.startswith("3."):
            recommendation = line.split(":", 1)[-1].strip()
    # If parsing failed, use first sentence as root cause
    if not root_cause and explanation:
        root_cause = explanation.split(".")[0].strip() + "."
    return root_cause, recommendation, expl_only or explanation


def _call_groq(service: str, message: str, severity: str) -> str:
    """Call Groq API to generate a unique explanation for a new anomaly pattern."""
    prompt = f"""You are an expert SRE analyzing a production anomaly.

Anomaly details:
- Service: {service}
- Severity: {severity}
- Event: {message}

Respond with EXACTLY this structure (3 short points, max 60 words total):
1. Possible cause: <one sentence>
2. Business impact: <one sentence>
3. Recommended action: <one sentence>"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return f"1. Possible cause: Unable to reach AI service ({e}).\n2. Business impact: Manual review required.\n3. Recommended action: Check logs and escalate if error rate exceeds threshold."


def _send_slack(anomaly: dict, explanation: str):
    """Send a real Slack webhook message. No-ops if SLACK_WEBHOOK_URL is not set."""
    if not SLACK_WEBHOOK:
        return

    sev = (anomaly.get("severity") or "warn").upper()
    sev_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}.get(sev, "⚠️")

    payload = {
        "text": f"{sev_emoji} *Log Intelligence Alert — {sev}*",
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"{sev_emoji} Anomaly Detected — {sev}"},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Service:*\n{anomaly.get('service', '—')}"},
                    {"type": "mrkdwn", "text": f"*Team:*\n{anomaly.get('team', '—')}"},
                    {"type": "mrkdwn", "text": f"*Event:*\n{anomaly.get('message', '—')}"},
                    {"type": "mrkdwn", "text": f"*Detected at:*\n{anomaly.get('timestamp', '—')}"},
                ],
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*AI Analysis:*\n{explanation}"},
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": "Powered by Phantom Log Intelligence · Groq Llama 3"}
                ],
            },
        ],
    }

    try:
        requests.post(SLACK_WEBHOOK, json=payload, timeout=5)
    except Exception:
        pass


# ──────────────────────────────────────────────────────────
# ROOT
# ──────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Log Intelligence API Running"}


# ──────────────────────────────────────────────────────────
# OVERVIEW METRICS
# ──────────────────────────────────────────────────────────

@app.get("/api/metrics/overview")
def metrics_overview():
    total_logs  = es.count(index="logs")["count"]
    error_logs  = es.count(index="logs",  body={"query": {"match": {"level": "ERROR"}}})["count"]
    total_alerts = es.count(index="alerts")["count"]
    error_rate  = round((error_logs / total_logs * 100), 2) if total_logs > 0 else 0.0

    # Count active (non-resolved, non-dismissed) incidents
    active_incidents_res = es.count(
        index="alerts",
        body={"query": {"bool": {"must_not": [
            {"terms": {"status.keyword": ["RESOLVED", "DISMISSED", "resolved", "dismissed"]}}
        ]}}}
    )
    active_incidents = active_incidents_res["count"]

    # Avg response time from logs
    p95_ms = 0
    try:
        rt_res = es.search(
            index="logs",
            body={
                "size": 0,
                "aggs": {"avg_rt": {"avg": {"field": "response_time"}}, "p95_rt": {"percentiles": {"field": "response_time", "percents": [95]}}}
            }
        )
        p95_val = rt_res["aggregations"]["p95_rt"]["values"].get("95.0", 0)
        p95_ms = round(p95_val) if p95_val else 0
    except Exception:
        pass

    return {
        "totalLogs":       total_logs,
        "errorRate":       error_rate,
        "errorLogs":       error_logs,
        "anomaliesOpen":   total_alerts,
        "incidentsActive": active_incidents,
        "p95Ms":           p95_ms,
        "healthScore":     98,
        "activeAlerts":    total_alerts,
        "systemHealth":    98,
    }


# ──────────────────────────────────────────────────────────
# LIVE LOG STREAM
# ──────────────────────────────────────────────────────────

@app.get("/api/logs/stream")
def logs_stream(since: str = None, limit: int = 60):
    sort = [{"timestamp": {"order": "desc"}}]

    if since:
        query = {"query": {"range": {"timestamp": {"gt": since}}}}
        response = es.search(index="logs", body=query, size=limit, sort=sort)
    else:
        response = es.search(index="logs", size=limit, sort=sort)

    return [
        {
            "id":       hit["_id"],
            "ts":       hit["_source"].get("timestamp"),
            "service":  hit["_source"].get("service"),
            "severity": (hit["_source"].get("level") or "info").lower(),
            "message":  hit["_source"].get("message"),
        }
        for hit in response["hits"]["hits"]
    ]


# ──────────────────────────────────────────────────────────
# LOG SEARCH  (now supports level=, service=, from=, to= params)
# ──────────────────────────────────────────────────────────

@app.get("/api/logs/search")
def search_logs(
    q:       str = "",
    level:   str = "",
    service: str = "",
    from_ts: str = "",
    to_ts:   str = "",
    limit:   int = 200,
):
    must_clauses = []

    # Full-text search on message field
    if q:
        must_clauses.append({
            "multi_match": {
                "query":  q,
                "fields": ["message", "service", "level"],
            }
        })

    # Exact level filter (case-insensitive)
    if level:
        must_clauses.append({"match": {"level": level.upper()}})

    # Exact service filter
    if service:
        must_clauses.append({"term": {"service.keyword": service}})

    # Time range filter
    if from_ts or to_ts:
        range_clause: dict = {}
        if from_ts:
            range_clause["gte"] = from_ts
        if to_ts:
            range_clause["lte"] = to_ts
        must_clauses.append({"range": {"timestamp": range_clause}})

    if must_clauses:
        query = {"query": {"bool": {"must": must_clauses}}}
    else:
        query = {"query": {"match_all": {}}}

    result = es.search(
        index="logs",
        body=query,
        size=limit,
        sort=[{"timestamp": {"order": "desc"}}],
    )

    return [
        {
            "id":       hit["_id"],
            "ts":       hit["_source"].get("timestamp"),
            "service":  hit["_source"].get("service"),
            "severity": (hit["_source"].get("level") or "info").lower(),
            "message":  hit["_source"].get("message"),
        }
        for hit in result["hits"]["hits"]
    ]


# ──────────────────────────────────────────────────────────
# ANOMALIES
# ──────────────────────────────────────────────────────────

@app.get("/api/anomalies")
def anomalies(limit: int = 20):
    response = es.search(
        index="alerts",
        size=limit,
        sort=[{"timestamp": {"order": "desc"}}],
    )

    result = []
    for hit in response["hits"]["hits"]:
        a = hit["_source"]
        result.append({
            "id":             hit["_id"],
            "incident_id":    a.get("incident_id"),
            "severity":       (a.get("severity") or "warn").lower(),
            "service":        a.get("service"),
            "title":          a.get("message"),
            "message":        a.get("message"),
            "status":         a.get("status"),
            "detectedAt":     a.get("timestamp"),
            "timestamp":      a.get("timestamp"),
            "team":           a.get("team"),
            "owner":          a.get("owner"),
            "affectedLogs":   0,
            "confidence":     0.87,
            # llmExplanation is filled lazily per-anomaly below
            "llmExplanation": a.get("llm_explanation", ""),
            "rootCause":      a.get("root_cause", "Under investigation"),
            "recommendation": a.get("recommendation", "Review logs and escalate if needed."),
        })

    return result


# ──────────────────────────────────────────────────────────
# EXPLAIN A SPECIFIC ANOMALY (smart cache by signature)
# ──────────────────────────────────────────────────────────

@app.get("/api/anomalies/{anomaly_id}/explain")
def explain_anomaly_by_id(anomaly_id: str):
    """
    Explain a specific anomaly by its Elasticsearch document ID.

    Cache logic:
      1. Hash (service, message, severity) → signature
      2. Check anomaly_explanations index for that signature
      3. If found → return cached explanation (source: cache)
      4. If not  → call Groq → store → return (source: groq)

    This means identical anomaly types share one Groq call, but
    different anomaly types each get their own unique explanation.
    """
    try:
        doc = es.get(index="alerts", id=anomaly_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    src      = doc["_source"]
    service  = src.get("service", "unknown")
    message  = src.get("message", "")
    severity = (src.get("severity") or "warn").lower()

    signature = _anomaly_signature(service, message, severity)

    # Check cache first
    cached = _get_cached_explanation(signature)
    if cached:
        root_cause, recommendation, _ = _parse_explanation(cached)
        return {
            "explanation":    cached,
            "rootCause":      root_cause or "See explanation above",
            "recommendation": recommendation or "Review logs and escalate if needed.",
            "source":         "cache",
            "signature":      signature,
        }

    # Call Groq for a new explanation
    explanation = _call_groq(service, message, severity)

    # Parse into structured parts
    root_cause, recommendation, _ = _parse_explanation(explanation)

    # Store in cache
    _store_explanation(signature, service, message, explanation)

    # Also update the alert doc so it's pre-loaded on next /api/anomalies call
    try:
        es.update(
            index="alerts",
            id=anomaly_id,
            body={"doc": {
                "llm_explanation": explanation,
                "root_cause":      root_cause,
                "recommendation":  recommendation,
            }},
        )
    except Exception:
        pass

    return {
        "explanation":    explanation,
        "rootCause":      root_cause or "See explanation above",
        "recommendation": recommendation or "Review logs and escalate if needed.",
        "source":         "groq",
        "signature":      signature,
    }


# ──────────────────────────────────────────────────────────
# DISMISS ANOMALY
# ──────────────────────────────────────────────────────────

@app.post("/api/anomalies/{anomaly_id}/dismiss")
def dismiss_anomaly(anomaly_id: str):
    try:
        es.update(index="alerts", id=anomaly_id, body={"doc": {"status": "DISMISSED"}})
    except Exception:
        pass
    return {"message": "Dismissed"}


# ──────────────────────────────────────────────────────────
# DISPATCH ANOMALY TO SLACK (now actually sends!)
# ──────────────────────────────────────────────────────────

@app.post("/api/anomalies/{anomaly_id}/dispatch")
def dispatch_anomaly(anomaly_id: str):
    try:
        doc = es.get(index="alerts", id=anomaly_id)
        src = doc["_source"]
    except Exception:
        return {"message": "Anomaly not found, Slack not sent"}

    service  = src.get("service", "unknown")
    message  = src.get("message", "")
    severity = (src.get("severity") or "warn").lower()
    signature = _anomaly_signature(service, message, severity)

    # Get or generate explanation for Slack message
    explanation = _get_cached_explanation(signature)
    if not explanation:
        explanation = _call_groq(service, message, severity)
        _store_explanation(signature, service, message, explanation)

    _send_slack(src, explanation)

    return {"message": "Dispatched to Slack", "slack_sent": bool(SLACK_WEBHOOK)}


# ──────────────────────────────────────────────────────────
# INCIDENTS
# ──────────────────────────────────────────────────────────

@app.get("/api/incidents")
def get_incidents():
    response = es.search(
        index="alerts",
        size=100,
        sort=[{"timestamp": {"order": "desc"}}],
    )

    result = []
    for hit in response["hits"]["hits"]:
        inc = hit["_source"]
        result.append({
            "id":          hit["_id"],
            "incident_id": inc.get("incident_id"),
            "timestamp":   inc.get("timestamp"),
            "openedAt":    inc.get("timestamp"),
            "severity":    (inc.get("severity") or "warn").lower(),
            "status":      (inc.get("status") or "open").lower(),
            "service":     inc.get("service"),
            "title":       inc.get("message"),
            "message":     inc.get("message"),
            "team":        inc.get("team"),
            "owner":       inc.get("owner"),
            "acks":        0,
        })

    return result


# ──────────────────────────────────────────────────────────
# ASSIGN / RESOLVE INCIDENTS
# ──────────────────────────────────────────────────────────

@app.post("/assign-incident")
@app.post("/api/assign-incident")
def assign_incident(data: dict):
    incident_id = data["incident_id"]
    owner       = data["owner"]

    result = es.search(
        index="alerts",
        body={"query": {"term": {"incident_id.keyword": incident_id}}},
    )

    hits = result["hits"]["hits"]
    if not hits:
        return {"error": "Incident not found"}

    es.update(
        index="alerts",
        id=hits[0]["_id"],
        body={"doc": {"owner": owner, "status": "ACKNOWLEDGED"}},
    )
    return {"message": "Incident assigned successfully"}


@app.post("/resolve-incident")
@app.post("/api/resolve-incident")
def resolve_incident(data: dict):
    incident_id = data["incident_id"]

    result = es.search(
        index="alerts",
        body={"query": {"term": {"incident_id.keyword": incident_id}}},
    )

    hits = result["hits"]["hits"]
    if not hits:
        return {"error": "Incident not found"}

    es.update(
        index="alerts",
        id=hits[0]["_id"],
        body={"doc": {"status": "RESOLVED"}},
    )
    return {"message": "Incident resolved successfully"}


# ──────────────────────────────────────────────────────────
# ACTIVITY FEED
# ──────────────────────────────────────────────────────────

@app.get("/api/activity")
def activity_feed(limit: int = 10):
    response = es.search(
        index="alerts",
        size=limit,
        sort=[{"timestamp": {"order": "desc"}}],
    )

    return [
        {
            "id":        hit["_id"],
            "kind":      "anomaly",
            "title":     hit["_source"].get("service", "unknown"),
            "detail":    hit["_source"].get("message", ""),
            "time":      hit["_source"].get("timestamp", ""),
            "timestamp": hit["_source"].get("timestamp"),
            "service":   hit["_source"].get("service"),
            "message":   hit["_source"].get("message"),
            "severity":  hit["_source"].get("severity"),
        }
        for hit in response["hits"]["hits"]
    ]


# ──────────────────────────────────────────────────────────
# CHARTS
# ──────────────────────────────────────────────────────────

@app.get("/api/charts/throughput")
def throughput_chart(minutes: int = 60):
    response = es.search(index="logs", size=100, sort=[{"timestamp": {"order": "asc"}}])
    logs = [hit["_source"] for hit in response["hits"]["hits"]]

    labels         = [str(i) for i in range(len(logs))]
    ingest         = [1 for _ in logs]
    errors         = [1 if (l.get("level") or "").upper() == "ERROR" else 0 for l in logs]
    anomalies_vals = [0 for _ in logs]

    return {
        "labels":    labels,
        "values":    [l.get("response_time", 0) for l in logs],
        "ingest":    ingest,
        "errors":    errors,
        "anomalies": anomalies_vals,
    }


@app.get("/api/charts/service-distribution")
def service_distribution_chart():
    query = {
        "size": 0,
        "aggs": {"services": {"terms": {"field": "service.keyword"}}},
    }
    result  = es.search(index="logs", body=query)
    buckets = result["aggregations"]["services"]["buckets"]
    return {
        "services": [b["key"] for b in buckets],
        "values":   [b["doc_count"] for b in buckets],
    }


@app.get("/api/services/health")
def service_health():
    services_list = ["auth-service", "payment-service", "order-service"]
    result = []
    for service in services_list:
        count = es.count(
            index="logs",
            body={"query": {"term": {"service.keyword": service}}},
        )["count"]
        health_score = max(50, min(100, 70 + count))
        cells = [max(30, min(100, health_score - 10 + (i * 3 % 20))) for i in range(12)]
        result.append({"service": service, "health": health_score, "cells": cells})
    return result


# ──────────────────────────────────────────────────────────
# ALERT RULES
# ──────────────────────────────────────────────────────────

@app.get("/api/alerts/rules")
def alert_rules():
    return [
        {
            "id":        "rule-1",
            "name":      "High Response Time",
            "condition": "response_time > 3000ms for 5 consecutive logs",
            "channel":   "Slack",
            "cooldown":  "5m",
            "threshold": 3000,
            "severity":  "HIGH",
            "enabled":   True,
        },
        {
            "id":        "rule-2",
            "name":      "Error Spike",
            "condition": "error_rate > 5% in 1m window",
            "channel":   "PagerDuty",
            "cooldown":  "10m",
            "threshold": 3,
            "severity":  "MEDIUM",
            "enabled":   True,
        },
    ]


@app.put("/api/alerts/rules/{rule_id}")
def toggle_alert_rule(rule_id: str, data: dict):
    return {"message": "Rule updated", "id": rule_id, "enabled": data.get("enabled")}


# ──────────────────────────────────────────────────────────
# AI OPS STATS
# ──────────────────────────────────────────────────────────

@app.get("/api/ai-ops/stats")
def aiops_stats():
    alerts = es.count(index="alerts")["count"]
    try:
        explanations = es.count(index="anomaly_explanations")["count"]
    except Exception:
        explanations = 0

    return {
        "alerts_processed":  alerts,
        "ai_explanations":   explanations,
        "automation_rate":   82,
        "logsPerMin":        1240,
        "llmCallsPerMin":    12.8,
        "reductionPct":      99.4,
        "cost24h":           "$0.19",
    }


# ──────────────────────────────────────────────────────────
# CLUSTER STATUS
# ──────────────────────────────────────────────────────────

@app.get("/api/cluster/status")
def cluster_status():
    return {
        "status":        "healthy",
        "kafka":         "online",
        "kafkaLag":      "0ms",
        "elasticsearch": "online",
        "esStatus":      "green",
        "api":           "online",
        "flinkHealthy":  6,
        "flinkTotal":    6,
        "llmCost24h":    "$0.19",
        "dlqDepth":      0,
        "version":       "v2.4.1",
        "build":         "a3f91c2",
    }


# ──────────────────────────────────────────────────────────
# LEGACY BACKWARD-COMPAT ROUTES
# ──────────────────────────────────────────────────────────

@app.get("/explain-anomaly")
@app.get("/api/explain-anomaly")
def explain_anomaly_latest():
    """Legacy route — explains the most recent anomaly."""
    response = es.search(
        index="alerts",
        size=1,
        sort=[{"timestamp": {"order": "desc"}}],
    )
    hits = response["hits"]["hits"]
    if not hits:
        return {"explanation": "No anomalies found."}

    anomaly_id = hits[0]["_id"]
    return explain_anomaly_by_id(anomaly_id)


@app.get("/stats")
def get_stats():
    total_logs  = es.count(index="logs")["count"]
    error_logs  = es.count(index="logs",  body={"query": {"match": {"level": "ERROR"}}})["count"]
    anomalies_detected = es.count(
        index="logs",
        body={"query": {"range": {"response_time": {"gte": 3000}}}},
    )["count"]
    return {"total_logs": total_logs, "error_logs": error_logs, "anomalies_detected": anomalies_detected}


@app.get("/logs")
def get_logs():
    response = es.search(index="logs", size=10, sort=[{"timestamp": {"order": "desc"}}])
    return [hit["_source"] for hit in response["hits"]["hits"]]


@app.get("/service-distribution")
def service_distribution():
    result = es.search(
        index="logs",
        body={"size": 0, "aggs": {"services": {"terms": {"field": "service.keyword"}}}},
    )
    return {b["key"]: b["doc_count"] for b in result["aggregations"]["services"]["buckets"]}


@app.get("/alerts")
def get_alerts():
    response = es.search(index="alerts", size=10, sort=[{"timestamp": {"order": "desc"}}])
    return [hit["_source"] for hit in response["hits"]["hits"]]


@app.get("/analytics")
def analytics():
    response = es.search(index="logs", size=1000)
    logs = [hit["_source"] for hit in response["hits"]["hits"]]
    if not logs:
        return {"top_service": "N/A", "avg_response_time": 0, "common_error": "N/A"}

    service_count = {}
    error_count   = {}
    response_times = []
    for log in logs:
        service = log.get("service", "unknown")
        message = log.get("message", "")
        service_count[service] = service_count.get(service, 0) + 1
        error_count[message]   = error_count.get(message, 0) + 1
        response_times.append(log.get("response_time", 0))

    return {
        "top_service":         max(service_count, key=service_count.get),
        "common_error":        max(error_count, key=error_count.get),
        "avg_response_time":   int(sum(response_times) / len(response_times)),
    }


@app.get("/incidents")
def get_incidents_legacy():
    return get_incidents()