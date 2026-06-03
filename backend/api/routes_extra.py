from fastapi import APIRouter
from elasticsearch import Elasticsearch

router = APIRouter()

es = Elasticsearch("http://localhost:9200")


# ==================================================
# OVERVIEW METRICS
# ==================================================

@router.get("/metrics/overview")
def metrics_overview():

    total_logs = es.count(index="logs")["count"]

    error_logs = es.count(
        index="logs",
        body={
            "query": {
                "match": {
                    "level": "ERROR"
                }
            }
        }
    )["count"]

    total_alerts = es.count(index="alerts")["count"]

    return {
        "totalLogs": total_logs,
        "errorLogs": error_logs,
        "activeAlerts": total_alerts,
        "systemHealth": 98
    }


# ==================================================
# LIVE LOG STREAM
# ==================================================

@router.get("/logs/stream")
def logs_stream():

    response = es.search(
        index="logs",
        size=50,
        sort=[
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ]
    )

    return [
        hit["_source"]
        for hit in response["hits"]["hits"]
    ]


# ==================================================
# ACTIVITY FEED
# ==================================================

@router.get("/activity")
def activity_feed():

    response = es.search(
        index="alerts",
        size=20,
        sort=[
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ]
    )

    activity = []

    for hit in response["hits"]["hits"]:

        alert = hit["_source"]

        activity.append({
            "timestamp": alert.get("timestamp"),
            "service": alert.get("service"),
            "message": alert.get("message"),
            "severity": alert.get("severity")
        })

    return activity


# ==================================================
# ANOMALIES
# ==================================================

@router.get("/anomalies")
def anomalies():

    response = es.search(
        index="alerts",
        size=100,
        sort=[
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ]
    )

    anomalies_list = []

    for hit in response["hits"]["hits"]:

        alert = hit["_source"]

        anomalies_list.append({
            "incident_id": alert.get("incident_id"),
            "severity": alert.get("severity"),
            "service": alert.get("service"),
            "message": alert.get("message"),
            "status": alert.get("status"),
            "timestamp": alert.get("timestamp"),
            "team": alert.get("team"),
            "owner": alert.get("owner")
        })

    return anomalies_list


# ==================================================
# THROUGHPUT CHART
# ==================================================

@router.get("/charts/throughput")
def throughput_chart():

    response = es.search(
        index="logs",
        size=100
    )

    logs = [
        hit["_source"]
        for hit in response["hits"]["hits"]
    ]

    return {
        "labels": list(range(len(logs))),
        "values": [
            log.get("response_time", 0)
            for log in logs
        ]
    }


# ==================================================
# SERVICE HEALTH
# ==================================================

@router.get("/services/health")
def service_health():

    services = [
        "auth-service",
        "payment-service",
        "order-service"
    ]

    health_data = []

    for service in services:

        query = {
            "query": {
                "term": {
                    "service.keyword": service
                }
            }
        }

        count = es.count(
            index="logs",
            body=query
        )["count"]

        health_score = max(
            50,
            min(100, 70 + count)
        )

        health_data.append({
            "service": service,
            "health": health_score
        })

    return health_data


# ==================================================
# LOG SEARCH
# ==================================================

@router.get("/logs/search")
def search_logs(q: str):

    query = {
        "query": {
            "multi_match": {
                "query": q,
                "fields": [
                    "service",
                    "message",
                    "level"
                ]
            }
        }
    }

    result = es.search(
        index="logs",
        body=query,
        size=100
    )

    return [
        hit["_source"]
        for hit in result["hits"]["hits"]
    ]


# ==================================================
# CLUSTER STATUS
# ==================================================

@router.get("/cluster/status")
def cluster_status():

    return {
        "status": "healthy",
        "kafka": "online",
        "elasticsearch": "online",
        "api": "online"
    }


# ==================================================
# AI OPS STATS
# ==================================================

@router.get("/ai-ops/stats")
def aiops_stats():

    alerts = es.count(
        index="alerts"
    )["count"]

    try:
        explanations = es.count(
            index="anomaly_explanations"
        )["count"]
    except:
        explanations = 0

    return {
        "alerts_processed": alerts,
        "ai_explanations": explanations,
        "automation_rate": 82
    }


# ==================================================
# ALERT RULES
# ==================================================

@router.get("/alert-rules")
def alert_rules():

    return [
        {
            "name": "High Response Time",
            "threshold": 3000,
            "severity": "HIGH"
        },
        {
            "name": "Error Spike",
            "threshold": 3,
            "severity": "MEDIUM"
        }
    ]