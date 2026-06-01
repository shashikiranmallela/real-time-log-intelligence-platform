# Day 4.6 - Dynamic Anomaly Explanation

## Objective

Generate AI explanations from real detected anomalies.

## Previous Approach

Used a hardcoded anomaly message.

## Improved Approach

Fetch latest anomaly from Elasticsearch alerts index.

Flow:

Alert -> Groq -> Explanation -> Dashboard

## Benefits

- Real-time explanations
- More realistic incident analysis
- Better production architecture