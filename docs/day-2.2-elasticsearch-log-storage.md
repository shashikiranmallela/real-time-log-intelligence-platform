# Day 2.2 — Elasticsearch Log Storage

## Objectives

- Store processed Kafka logs into Elasticsearch
- Create searchable persistent log storage
- Enable future observability dashboards and analytics

---

## Elasticsearch Integration

The consumer service now indexes all processed logs into Elasticsearch using the Python Elasticsearch client.

---

## Log Index

Logs are stored inside the `application-logs` index.

---

## Benefits

- persistent log retention
- full-text search
- filtering
- analytics
- dashboard integration

---

## Notes

This phase transforms the platform from a temporary streaming system into a persistent observability backend.