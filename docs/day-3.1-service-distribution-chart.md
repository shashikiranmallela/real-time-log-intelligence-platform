# Day 3.1 - Service Distribution Chart

## Objective

Visualize log distribution across different services using a Pie Chart.

## Technologies Used

- React
- Chart.js
- react-chartjs-2

## Implementation

Installed chart libraries:

npm install chart.js react-chartjs-2

Created ServiceChart.jsx component.

Fetched service distribution data from FastAPI endpoint:

GET /service-distribution

Example Response:

{
  "auth-service": 2034,
  "order-service": 2010,
  "payment-service": 1961
}

Displayed service-wise log percentages using a Pie Chart.

## Outcome

Users can quickly identify which service is generating the most logs.
