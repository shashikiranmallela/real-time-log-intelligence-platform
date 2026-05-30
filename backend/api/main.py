from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Elasticsearch
es = Elasticsearch("http://localhost:9200")

# Home route
@app.get("/")
def home():
    return {"message": "Log Intelligence API Running"}

# Fetch dashboard stats
@app.get("/stats")
def get_stats():

    total_logs = es.count(index="logs")["count"]

    error_query = {
        "query": {
            "match": {
                "level": "ERROR"
            }
        }
    }

    error_logs = es.count(
        index="logs",
        body=error_query
    )["count"]

    anomaly_query = {
        "query": {
            "range": {
                "response_time": {
                    "gte": 3000
                }
            }
        }
    }

    anomalies_detected = es.count(
        index="logs",
        body=anomaly_query
    )["count"]

    return {
        "total_logs": total_logs,
        "error_logs": error_logs,
        "anomalies_detected": anomalies_detected
    }

# Fetch recent logs
@app.get("/logs")
def get_logs():

    response = es.search(
        index="logs",
        size=10,
        sort=[
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ]
    )

    logs = []

    for hit in response["hits"]["hits"]:
        logs.append(hit["_source"])

    return logs
@app.get("/service-distribution")
def service_distribution():

    query = {
        "size": 0,
        "aggs": {
            "services": {
                "terms": {
                    "field": "service.keyword"
                }
            }
        }
    }

    result = es.search(
        index="logs",
        body=query
    )

    distribution = {}

    buckets = result["aggregations"]["services"]["buckets"]

    for bucket in buckets:
        distribution[bucket["key"]] = bucket["doc_count"]

    return distribution
@app.get("/alerts")
def get_alerts():

    response = es.search(
        index="alerts",
        size=10,
        sort=[
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ]
    )

    alerts = []

    for hit in response["hits"]["hits"]:
        alerts.append(hit["_source"])

    return alerts
@app.get("/analytics")
def analytics():

    response = es.search(
        index="logs",
        size=1000
    )

    logs = [
        hit["_source"]
        for hit in response["hits"]["hits"]
    ]

    if not logs:
        return {
            "top_service": "N/A",
            "avg_response_time": 0,
            "common_error": "N/A"
        }

    service_count = {}
    error_count = {}
    response_times = []

    for log in logs:

        service = log.get("service", "unknown")
        message = log.get("message", "")

        service_count[service] = (
            service_count.get(service, 0) + 1
        )

        error_count[message] = (
            error_count.get(message, 0) + 1
        )

        response_times.append(
            log.get("response_time", 0)
        )

    top_service = max(
        service_count,
        key=service_count.get
    )

    common_error = max(
        error_count,
        key=error_count.get
    )

    avg_response_time = int(
        sum(response_times)
        / len(response_times)
    )

    return {
        "top_service": top_service,
        "common_error": common_error,
        "avg_response_time": avg_response_time
    }