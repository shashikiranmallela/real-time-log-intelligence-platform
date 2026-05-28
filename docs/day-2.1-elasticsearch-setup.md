# Day 2.1 — Elasticsearch Infrastructure Setup

## Objectives

- Setup Elasticsearch locally using Docker
- Prepare searchable log storage layer
- Enable future full-text log search and analytics

---

## Why Elasticsearch?

Elasticsearch is a distributed search and analytics engine optimized for large-scale log storage and querying.

It enables:
- full-text search
- filtering
- analytics
- dashboard integrations

---

## Infrastructure

Elasticsearch is containerized using Docker Compose.

Port:
- 9200

---

## Notes

Elasticsearch will act as the persistent storage layer for all processed logs and anomaly events.