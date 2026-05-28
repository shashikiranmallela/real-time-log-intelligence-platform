# Day 2.3 — Search & Filter Logs API

## Objectives

- Build FastAPI backend
- Query Elasticsearch logs
- Create searchable log APIs
- Enable filtering by service and severity

---

## APIs Implemented

### GET /api/logs
Returns all logs.

### GET /api/logs/service/{service_name}
Returns logs filtered by service.

### GET /api/logs/level/{log_level}
Returns logs filtered by severity level.

---

## Technologies Used

- FastAPI
- Elasticsearch
- REST APIs

---

## Notes

This phase transforms the platform into a queryable observability backend with searchable APIs.