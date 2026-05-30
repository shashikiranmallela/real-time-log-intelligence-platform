# Day 4.2 - Dashboard Analytics

## Objective

Provide high-level operational insights from collected logs.

## Features Implemented

### Top Service

Displays the service generating the highest number of logs.

### Most Common Error

Displays the most frequently occurring error message.

### Average Response Time

Displays average response time across collected logs.

## Backend Changes

Added:

- /analytics API endpoint

## Frontend Changes

Added three analytics cards:

- Top Service
- Most Common Error
- Avg Response Time

## Files Modified

- backend/api/main.py
- frontend/src/App.jsx

## Outcome

Dashboard now provides business-level insights in addition to raw log monitoring.