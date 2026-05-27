# Day 1.3 — Kafka Producer Service

## Objectives

- Build Kafka producer service
- Simulate realistic application logs
- Stream structured JSON logs into Kafka
- Create continuous real-time event generation

---

## Kafka Producer

The producer connects to Kafka and continuously publishes log events to the `application-logs` topic.

---

## Simulated Services

- auth-service
- payment-service
- order-service

---

## Log Structure

Each log contains:

- timestamp
- service
- level
- message
- response_time

---

## Notes

The producer simulates real microservice application behavior by generating random log events continuously.