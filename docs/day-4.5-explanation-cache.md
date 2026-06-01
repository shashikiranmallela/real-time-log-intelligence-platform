# Day 4.5 - Explanation Cache

## Objective

Reduce Groq API calls and save tokens.

## Elasticsearch Cache

Index:

anomaly_explanations

Stored fields:

- anomaly
- explanation
- timestamp

## Flow

1. User requests explanation
2. Search cache
3. If found → return cached response
4. If not found → call Groq
5. Save explanation into Elasticsearch

## Benefits

- Lower token usage
- Faster responses
- Reduced API cost