from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

es = Elasticsearch("http://localhost:9200")


@app.get("/")
def home():
    return {"message": "Log Intelligence API Running"}


# ==================================================
# OVERVIEW METRICS  →  GET /api/metrics/overview
# ==================================================

@app.get("/api/metrics/overview")
def metrics_overview():

    total_logs = es.count(index="logs")["count"]

    error_logs = es.count(
        index="logs",
        body={"query": {"match": {"level": "ERROR"}}}
    )["count"]

    total_alerts = es.count(index="alerts")["count"]

    error_rate = round((error_logs / total_logs * 100), 2) if total_logs > 0 else 0.0

    return {
        "totalLogs": total_logs,
        "errorRate": error_rate,
        "errorLogs": error_logs,
        "anomaliesOpen": total_alerts,
        "incidentsActive": 0,
        "p95Ms": 0,
        "healthScore": 98,
        "activeAlerts": total_alerts,
        "systemHealth": 98,
    }


# ==================================================
# LIVE LOG STREAM  →  GET /api/logs/stream
# ==================================================

@app.get("/api/logs/stream")
def logs_stream(since: str = None, limit: int = 60):

    sort = [{"timestamp": {"order": "desc"}}]

    if since:
        query = {
            "query": {
                "range": {
                    "timestamp": {"gt": since}
                }
            }
        }
        response = es.search(index="logs", body=query, size=limit, sort=sort)
    else:
        response = es.search(index="logs", size=limit, sort=sort)

    return [
        {
            "id": hit["_id"],
            "ts": hit["_source"].get("timestamp"),
            "service": hit["_source"].get("service"),
            "severity": (hit["_source"].get("level") or "info").lower(),
            "message": hit["_source"].get("message"),
        }
        for hit in response["hits"]["hits"]
    ]


# ==================================================
# LOG SEARCH  →  GET /api/logs/search
# ==================================================

@app.get("/api/logs/search")
def search_logs(q: str = "", limit: int = 200):

    if q:
        query = {
            "query": {
                "multi_match": {
                    "query": q,
                    "fields": ["service", "message", "level"]
                }
            }
        }
    else:
        query = {"query": {"match_all": {}}}

    result = es.search(index="logs", body=query, size=limit)

    return [
        {
            "id": hit["_id"],
            "ts": hit["_source"].get("timestamp"),
            "service": hit["_source"].get("service"),
            "severity": (hit["_source"].get("level") or "info").lower(),
            "message": hit["_source"].get("message"),
        }
        for hit in result["hits"]["hits"]
    ]


# ==================================================
# ANOMALIES  →  GET /api/anomalies
# ==================================================

@app.get("/api/anomalies")
def anomalies(limit: int = 20):

    response = es.search(
        index="alerts",
        size=limit,
        sort=[{"timestamp": {"order": "desc"}}]
    )

    result = []
    for hit in response["hits"]["hits"]:
        a = hit["_source"]
        result.append({
            "id": hit["_id"],
            "incident_id": a.get("incident_id"),
            "severity": (a.get("severity") or "warn").lower(),
            "service": a.get("service"),
            "title": a.get("message"),
            "message": a.get("message"),
            "status": a.get("status"),
            "detectedAt": a.get("timestamp"),
            "timestamp": a.get("timestamp"),
            "team": a.get("team"),
            "owner": a.get("owner"),
            "affectedLogs": 0,
            "confidence": 0.87,
            "llmExplanation": a.get("message"),
            "rootCause": "Under investigation",
            "recommendation": "Review logs and escalate if needed.",
        })

    return result


# ==================================================
# DISMISS ANOMALY  →  POST /api/anomalies/{id}/dismiss
# ==================================================

@app.post("/api/anomalies/{anomaly_id}/dismiss")
def dismiss_anomaly(anomaly_id: str):
    try:
        es.update(
            index="alerts",
            id=anomaly_id,
            body={"doc": {"status": "DISMISSED"}}
        )
    except Exception:
        pass
    return {"message": "Dismissed"}


# ==================================================
# DISPATCH ANOMALY  →  POST /api/anomalies/{id}/dispatch
# ==================================================

@app.post("/api/anomalies/{anomaly_id}/dispatch")
def dispatch_anomaly(anomaly_id: str):
    return {"message": "Dispatched to Slack"}


# ==================================================
# INCIDENTS  →  GET /api/incidents
# ==================================================

@app.get("/api/incidents")
def get_incidents():

    response = es.search(
        index="alerts",
        size=100,
        sort=[{"timestamp": {"order": "desc"}}]
    )

    result = []
    for hit in response["hits"]["hits"]:
        inc = hit["_source"]
        result.append({
            "id": hit["_id"],
            "incident_id": inc.get("incident_id"),
            "timestamp": inc.get("timestamp"),
            "openedAt": inc.get("timestamp"),
            "severity": (inc.get("severity") or "warn").lower(),
            "status": (inc.get("status") or "open").lower(),
            "service": inc.get("service"),
            "title": inc.get("message"),
            "message": inc.get("message"),
            "team": inc.get("team"),
            "owner": inc.get("owner"),
            "acks": 0,
        })

    return result


# ==================================================
# ASSIGN INCIDENT  →  POST /assign-incident  (kept for backward compat)
# ==================================================

@app.post("/assign-incident")
@app.post("/api/assign-incident")
def assign_incident(data: dict):

    incident_id = data["incident_id"]
    owner = data["owner"]

    result = es.search(
        index="alerts",
        body={"query": {"term": {"incident_id.keyword": incident_id}}}
    )

    hits = result["hits"]["hits"]
    if not hits:
        return {"error": "Incident not found"}

    es.update(
        index="alerts",
        id=hits[0]["_id"],
        body={"doc": {"owner": owner, "status": "ACKNOWLEDGED"}}
    )
    return {"message": "Incident assigned successfully"}


# ==================================================
# RESOLVE INCIDENT  →  POST /resolve-incident  (kept for backward compat)
# ==================================================

@app.post("/resolve-incident")
@app.post("/api/resolve-incident")
def resolve_incident(data: dict):

    incident_id = data["incident_id"]

    result = es.search(
        index="alerts",
        body={"query": {"term": {"incident_id.keyword": incident_id}}}
    )

    hits = result["hits"]["hits"]
    if not hits:
        return {"error": "Incident not found"}

    es.update(
        index="alerts",
        id=hits[0]["_id"],
        body={"doc": {"status": "RESOLVED"}}
    )
    return {"message": "Incident resolved successfully"}


# ==================================================
# ACTIVITY FEED  →  GET /api/activity
# ==================================================

@app.get("/api/activity")
def activity_feed(limit: int = 10):

    response = es.search(
        index="alerts",
        size=limit,
        sort=[{"timestamp": {"order": "desc"}}]
    )

    result = []
    for i, hit in enumerate(response["hits"]["hits"]):
        a = hit["_source"]
        result.append({
            "id": hit["_id"],
            "kind": "anomaly",
            "title": a.get("service", "unknown"),
            "detail": a.get("message", ""),
            "time": a.get("timestamp", ""),
            "timestamp": a.get("timestamp"),
            "service": a.get("service"),
            "message": a.get("message"),
            "severity": a.get("severity"),
        })

    return result


# ==================================================
# THROUGHPUT CHART  →  GET /api/charts/throughput
# ==================================================

@app.get("/api/charts/throughput")
def throughput_chart(minutes: int = 60):

    response = es.search(index="logs", size=100)

    logs = [hit["_source"] for hit in response["hits"]["hits"]]

    labels = [str(i) for i in range(len(logs))]
    ingest = [1 for _ in logs]
    errors = [1 if (l.get("level") or "").upper() == "ERROR" else 0 for l in logs]
    anomalies_vals = [0 for _ in logs]

    return {
        "labels": labels,
        "values": [l.get("response_time", 0) for l in logs],
        "ingest": ingest,
        "errors": errors,
        "anomalies": anomalies_vals,
    }


# ==================================================
# SERVICE DISTRIBUTION  →  GET /api/charts/service-distribution
# ==================================================

@app.get("/api/charts/service-distribution")
def service_distribution_chart():

    query = {
        "size": 0,
        "aggs": {
            "services": {
                "terms": {"field": "service.keyword"}
            }
        }
    }

    result = es.search(index="logs", body=query)
    buckets = result["aggregations"]["services"]["buckets"]

    services = [b["key"] for b in buckets]
    values = [b["doc_count"] for b in buckets]

    return {"services": services, "values": values}


# ==================================================
# SERVICE HEALTH  →  GET /api/services/health
# ==================================================

@app.get("/api/services/health")
def service_health():

    services_list = ["auth-service", "payment-service", "order-service"]
    result = []

    for service in services_list:
        count = es.count(
            index="logs",
            body={"query": {"term": {"service.keyword": service}}}
        )["count"]

        health_score = max(50, min(100, 70 + count))
        cells = [max(30, min(100, health_score - 10 + (i * 3 % 20))) for i in range(12)]

        result.append({
            "service": service,
            "health": health_score,
            "cells": cells,
        })

    return result


# ==================================================
# ALERT RULES  →  GET /api/alerts/rules
# ==================================================

@app.get("/api/alerts/rules")
def alert_rules():
    return [
        {
            "id": "rule-1",
            "name": "High Response Time",
            "condition": "response_time > 3000ms for 5 consecutive logs",
            "channel": "Slack",
            "cooldown": "5m",
            "threshold": 3000,
            "severity": "HIGH",
            "enabled": True,
        },
        {
            "id": "rule-2",
            "name": "Error Spike",
            "condition": "error_rate > 5% in 1m window",
            "channel": "PagerDuty",
            "cooldown": "10m",
            "threshold": 3,
            "severity": "MEDIUM",
            "enabled": True,
        },
    ]


# ==================================================
# TOGGLE ALERT RULE  →  PUT /api/alerts/rules/{id}
# ==================================================

@app.put("/api/alerts/rules/{rule_id}")
def toggle_alert_rule(rule_id: str, data: dict):
    return {"message": "Rule updated", "id": rule_id, "enabled": data.get("enabled")}


# ==================================================
# AI OPS STATS  →  GET /api/ai-ops/stats
# ==================================================

@app.get("/api/ai-ops/stats")
def aiops_stats():

    alerts = es.count(index="alerts")["count"]

    try:
        explanations = es.count(index="anomaly_explanations")["count"]
    except Exception:
        explanations = 0

    return {
        "alerts_processed": alerts,
        "ai_explanations": explanations,
        "automation_rate": 82,
        "logsPerMin": 1240,
        "llmCallsPerMin": 12.8,
        "reductionPct": 99.4,
        "cost24h": "$0.19",
    }


# ==================================================
# CLUSTER STATUS  →  GET /api/cluster/status
# ==================================================

@app.get("/api/cluster/status")
def cluster_status():
    return {
        "status": "healthy",
        "kafka": "online",
        "kafkaLag": "0ms",
        "elasticsearch": "online",
        "esStatus": "green",
        "api": "online",
        "flinkHealthy": 6,
        "flinkTotal": 6,
        "llmCost24h": "$0.19",
        "dlqDepth": 0,
        "version": "v2.4.1",
        "build": "a3f91c2",
    }


# ==================================================
# EXPLAIN ANOMALY  →  GET /explain-anomaly  (kept for backward compat)
# ==================================================

@app.get("/explain-anomaly")
@app.get("/api/explain-anomaly")
def explain_anomaly():

    response = es.search(
        index="alerts",
        size=1,
        sort=[{"timestamp": {"order": "desc"}}]
    )

    hits = response["hits"]["hits"]
    if not hits:
        return {"explanation": "No anomalies found."}

    alert = hits[0]["_source"]
    error_message = alert["message"]

    # Check cache
    try:
        cache_result = es.search(
            index="anomaly_explanations",
            body={"query": {"match": {"error_message": error_message}}}
        )
        if cache_result["hits"]["total"]["value"] > 0:
            cached = cache_result["hits"]["hits"][0]["_source"]["explanation"]
            return {"explanation": cached, "source": "cache"}
    except Exception:
        pass

    # Call Groq
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": f"""
Explain this anomaly:

{error_message}

Give ONLY:
1. Possible cause
2. Business impact
3. Recommended action

Maximum 40 words.
"""
            }
        ]
    )

    explanation = completion.choices[0].message.content

    try:
        es.index(
            index="anomaly_explanations",
            document={"error_message": error_message, "explanation": explanation}
        )
    except Exception:
        pass

    return {"explanation": explanation, "source": "groq"}


# ==================================================
# LEGACY ROUTES (kept for backward compatibility)
# ==================================================

@app.get("/stats")
def get_stats():
    total_logs = es.count(index="logs")["count"]
    error_logs = es.count(
        index="logs",
        body={"query": {"match": {"level": "ERROR"}}}
    )["count"]
    anomalies_detected = es.count(
        index="logs",
        body={"query": {"range": {"response_time": {"gte": 3000}}}}
    )["count"]
    return {
        "total_logs": total_logs,
        "error_logs": error_logs,
        "anomalies_detected": anomalies_detected,
    }


@app.get("/logs")
def get_logs():
    response = es.search(
        index="logs",
        size=10,
        sort=[{"timestamp": {"order": "desc"}}]
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]


@app.get("/service-distribution")
def service_distribution():
    result = es.search(
        index="logs",
        body={
            "size": 0,
            "aggs": {"services": {"terms": {"field": "service.keyword"}}}
        }
    )
    distribution = {}
    for bucket in result["aggregations"]["services"]["buckets"]:
        distribution[bucket["key"]] = bucket["doc_count"]
    return distribution


@app.get("/alerts")
def get_alerts():
    response = es.search(
        index="alerts",
        size=10,
        sort=[{"timestamp": {"order": "desc"}}]
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]


@app.get("/analytics")
def analytics():
    response = es.search(index="logs", size=1000)
    logs = [hit["_source"] for hit in response["hits"]["hits"]]

    if not logs:
        return {"top_service": "N/A", "avg_response_time": 0, "common_error": "N/A"}

    service_count = {}
    error_count = {}
    response_times = []

    for log in logs:
        service = log.get("service", "unknown")
        message = log.get("message", "")
        service_count[service] = service_count.get(service, 0) + 1
        error_count[message] = error_count.get(message, 0) + 1
        response_times.append(log.get("response_time", 0))

    return {
        "top_service": max(service_count, key=service_count.get),
        "common_error": max(error_count, key=error_count.get),
        "avg_response_time": int(sum(response_times) / len(response_times)),
    }


@app.get("/incidents")
def get_incidents_legacy():
    return get_incidents()
