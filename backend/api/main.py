from fastapi import FastAPI
from elasticsearch import Elasticsearch

app = FastAPI()

# Elasticsearch client
es = Elasticsearch("http://localhost:9200")


@app.get("/")
def home():
    return {
        "message": "Real-Time Log Intelligence Platform API"
    }


@app.get("/api/logs")
def get_logs():

    response = es.search(
        index="application-logs",
        size=20,
        query={
            "match_all": {}
        }
    )

    logs = []

    for hit in response["hits"]["hits"]:
        logs.append(hit["_source"])

    return {
        "total_logs": len(logs),
        "logs": logs
    }


@app.get("/api/logs/service/{service_name}")
def get_logs_by_service(service_name: str):

    response = es.search(
        index="application-logs",
        size=20,
        query={
            "match": {
                "service": service_name
            }
        }
    )

    logs = []

    for hit in response["hits"]["hits"]:
        logs.append(hit["_source"])

    return {
        "service": service_name,
        "total_logs": len(logs),
        "logs": logs
    }


@app.get("/api/logs/level/{log_level}")
def get_logs_by_level(log_level: str):

    response = es.search(
        index="application-logs",
        size=20,
        query={
            "match": {
                "level": log_level
            }
        }
    )

    logs = []

    for hit in response["hits"]["hits"]:
        logs.append(hit["_source"])

    return {
        "level": log_level,
        "total_logs": len(logs),
        "logs": logs
    }