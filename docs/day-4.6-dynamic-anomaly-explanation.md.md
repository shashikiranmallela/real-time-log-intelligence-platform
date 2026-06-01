# Day 4.6 - Dynamic Anomaly Explanation

## Objective

Generate AI explanations from real detected anomalies.

## Previous Approach

Used a hardcoded anomaly message.

## Improved Approach

Fetch latest anomaly from Elasticsearch alerts index.

Flow:

Alert -> Groq -> Explanation -> Dashboard

## Cache Optimization

Before calling Groq:

1. Search Elasticsearch cache
2. Return cached explanation if available
3. Otherwise call Groq and store result

## Benefits

- Real-time anomaly explanations
- Reduced token usage
- Faster response times
- Production-ready architecture