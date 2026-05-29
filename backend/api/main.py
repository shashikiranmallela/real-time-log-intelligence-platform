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