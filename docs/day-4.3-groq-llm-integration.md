# Day 4.4 - Groq LLM Integration

## Objective
Integrate Groq LLM to generate natural language explanations for anomalies.

## Features
- Connected FastAPI to Groq API
- Extracted latest anomaly from Elasticsearch
- Built dynamic prompt generation
- Generated AI explanations
- Returned explanation through REST API

## Endpoint
GET /explain-anomaly

## Example Output

{
  "explanation": "High response time detected in payment-service..."
}

## Learning
- LLM API integration
- Prompt engineering
- FastAPI + Groq workflow
- AI-powered anomaly explanation