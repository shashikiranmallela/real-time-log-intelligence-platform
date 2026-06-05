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

// Metrics overview
export const fetchOverviewMetrics = () =>
  http.get("/api/metrics/overview").then((r) => r.data);

// Logs stream
export const fetchRecentLogs = (limit = 60) =>
  http.get("/api/logs/stream", { params: { limit } }).then((r) => r.data);

export const fetchLogsSince = (sinceIso, limit = 100) =>
  http.get("/api/logs/stream", { params: { since: sinceIso, limit } }).then((r) => r.data);

// Search — supports q, level, service, from_ts, to_ts
export const searchLogs = (params = {}, limit = 200) => {
  const { q = "", level = "", service = "", from_ts = "", to_ts = "" } =
    typeof params === "string" ? { q: params } : params;
  return http
    .get("/api/logs/search", { params: { q, level, service, from_ts, to_ts, limit } })
    .then((r) => r.data);
};

// Anomalies
export const fetchAnomalies = (limit = 20) =>
  http.get("/api/anomalies", { params: { limit } }).then((r) => r.data);

export const dismissAnomaly = (id) =>
  http.post(`/api/anomalies/${id}/dismiss`).then((r) => r.data);

export const dispatchAnomalyToSlack = (id) =>
  http.post(`/api/anomalies/${id}/dispatch`).then((r) => r.data);

// Per-anomaly AI explanation — cached by anomaly type, not every call hits Groq
export const explainAnomaly = (id) =>
  http.get(`/api/anomalies/${id}/explain`).then((r) => r.data);

// Incidents
export const fetchIncidents = () =>
  http.get("/api/incidents").then((r) => r.data);

export const assignIncident = (incident_id, owner) =>
  http.post("/api/assign-incident", { incident_id, owner }).then((r) => r.data);

export const resolveIncident = (incident_id) =>
  http.post("/api/resolve-incident", { incident_id }).then((r) => r.data);

// Activity feed
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
