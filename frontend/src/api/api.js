// ============================================================================
// Centralized API client — Phantom Observability Platform
// All HTTP calls live here. Components consume data via props only.
// Configure base URL via VITE_API_BASE_URL in .env, or use the Vite proxy.
// ============================================================================
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Metrics overview — GET /api/metrics/overview
export const fetchOverviewMetrics = () =>
  http.get("/api/metrics/overview").then((r) => r.data);

// Logs — GET /api/logs/stream?since=<iso>&limit=<n>
export const fetchRecentLogs = (limit = 60) =>
  http.get("/api/logs/stream", { params: { limit } }).then((r) => r.data);

export const fetchLogsSince = (sinceIso, limit = 100) =>
  http.get("/api/logs/stream", { params: { since: sinceIso, limit } }).then((r) => r.data);

// Search — GET /api/logs/search?q=<text>&limit=<n>
export const searchLogs = (q, limit = 200) =>
  http.get("/api/logs/search", { params: { q, limit } }).then((r) => r.data);

// Anomalies — GET /api/anomalies?limit=<n>
export const fetchAnomalies = (limit = 20) =>
  http.get("/api/anomalies", { params: { limit } }).then((r) => r.data);

export const dismissAnomaly = (id) =>
  http.post(`/api/anomalies/${id}/dismiss`).then((r) => r.data);

export const dispatchAnomalyToSlack = (id) =>
  http.post(`/api/anomalies/${id}/dispatch`).then((r) => r.data);

// Incidents — GET /api/incidents
export const fetchIncidents = () =>
  http.get("/api/incidents").then((r) => r.data);

// Activity feed — GET /api/activity?limit=<n>
export const fetchActivity = (limit = 10) =>
  http.get("/api/activity", { params: { limit } }).then((r) => r.data);

// Charts
export const fetchThroughput = (minutes = 60) =>
  http.get("/api/charts/throughput", { params: { minutes } }).then((r) => r.data);

export const fetchServiceDistribution = () =>
  http.get("/api/charts/service-distribution").then((r) => r.data);

export const fetchServiceHealth = () =>
  http.get("/api/services/health").then((r) => r.data);

// Alert rules
export const fetchAlertRules = () =>
  http.get("/api/alerts/rules").then((r) => r.data);

export const toggleAlertRule = (id, enabled) =>
  http.put(`/api/alerts/rules/${id}`, { enabled }).then((r) => r.data);

// AI Ops stats
export const fetchAIOpsStats = () =>
  http.get("/api/ai-ops/stats").then((r) => r.data);

// Cluster status
export const fetchClusterStatus = () =>
  http.get("/api/cluster/status").then((r) => r.data);
