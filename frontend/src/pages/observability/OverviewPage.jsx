import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, Gauge, HeartPulse, Sparkles, Timer, TrendingUp, Zap,
} from "lucide-react";
import {
  DashboardLayout, MetricCard, LiveLogStream, AIOpsPanel, IncidentCenter,
  ServiceHeatmap, ThroughputChart, ServiceDistribution, ActivityFeed,
} from "@/components/observability";
import {
  fetchOverviewMetrics, fetchAnomalies, fetchIncidents, fetchActivity,
  fetchThroughput, fetchServiceDistribution, fetchServiceHealth,
  fetchRecentLogs, fetchLogsSince, fetchClusterStatus,
} from "@/api/api";

const REFRESH_MS = 5000;

// Format numbers: 0–999 → plain, 1000+ → "1.2K", 1M+ → "1.2M"
function fmtCount(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return Math.round(v).toLocaleString();
}

export default function OverviewPage() {
  const navigate = useNavigate();

  const [metrics,    setMetrics]    = useState(null);
  const [anomalies,  setAnomalies]  = useState([]);
  const [incidents,  setIncidents]  = useState([]);
  const [activity,   setActivity]   = useState([]);
  const [throughput, setThroughput] = useState({ labels: [], ingest: [], errors: [], anomalies: [] });
  const [dist,       setDist]       = useState({ services: [], values: [] });
  const [health,     setHealth]     = useState([]);
  const [cluster,    setCluster]    = useState(null);
  const [logs,       setLogs]       = useState([]);
  const [paused,     setPaused]     = useState(false);

  // Poll all non-log data every 5 s
  useEffect(() => {
    const loadAll = () => {
      fetchOverviewMetrics().then(setMetrics).catch(() => {});
      fetchAnomalies(10).then(setAnomalies).catch(() => {});
      fetchIncidents().then(setIncidents).catch(() => {});
      fetchActivity(10).then(setActivity).catch(() => {});
      fetchThroughput(60).then(setThroughput).catch(() => {});
      fetchServiceDistribution().then(setDist).catch(() => {});
      fetchServiceHealth().then(setHealth).catch(() => {});
      fetchClusterStatus().then(setCluster).catch(() => {});
    };
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // Initial log fetch
  useEffect(() => {
    fetchRecentLogs(60).then(setLogs).catch(() => {});
  }, []);

  // Live log tailing
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const last = logs[logs.length - 1];
      const sinceIso = last ? last.ts : new Date(Date.now() - 5000).toISOString();
      fetchLogsSince(sinceIso, 50)
        .then((newLogs) => {
          if (!newLogs || newLogs.length === 0) return;
          setLogs((prev) => [...prev, ...newLogs].slice(-200));
        })
        .catch(() => {});
    }, 1000);
    return () => clearInterval(id);
  }, [paused, logs]);

  const m = metrics || {};

  return (
    <DashboardLayout
      title="Overview"
      subtitle="phantom://cluster-omega · us-east-1-prod"
      sidebarBadges={{
        anomalies: anomalies.length ? String(anomalies.length) : undefined,
        incidents: incidents.filter((i) => i.status !== "resolved").length || undefined,
      }}
      llm={{ callsPerMin: 12.8, reductionPct: 99.4, progressPct: 14 }}
    >
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">

        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 animate-slide-up">
          <MetricCard
            label="Total Logs"
            value={m.totalLogs ?? 0}
            format={fmtCount}
            unit="today"
            trend={m.totalLogsTrend}
            icon={Activity}
            accent="primary"
          />
          <MetricCard
            label="Error Rate"
            value={m.errorRate ?? 0}
            format={(n) => (Number(n) || 0).toFixed(2)}
            unit="%"
            trend={m.errorRateTrend}
            trendDir="down-good"
            icon={TrendingUp}
            accent="warn"
          />
          <MetricCard
            label="Anomalies"
            value={m.anomaliesOpen ?? 0}
            unit="open"
            trend={m.anomaliesTrend}
            trendDir="down-good"
            icon={AlertTriangle}
            accent="critical"
          />
          <MetricCard
            label="Active Incidents"
            value={m.incidentsActive ?? 0}
            trend={m.incidentsTrend}
            trendDir="down-good"
            icon={Zap}
            accent="critical"
          />
          <MetricCard
            label="Avg Response"
            value={m.p95Ms ?? 0}
            unit="ms · p95"
            trend={m.p95Trend}
            trendDir="down-good"
            icon={Timer}
            accent="primary"
          />
          <MetricCard
            label="System Health"
            value={m.healthScore ?? 0}
            unit="/ 100"
            trend={m.healthTrend}
            icon={HeartPulse}
            accent="success"
          />
        </section>

        {/* AI Ops + Incidents */}
        <section
          className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="xl:col-span-2">
            <AIOpsPanel
              anomaly={anomalies[0]}
              meta={{ cost: "$0.0008", tokens: 412, latencyMs: 247 }}
            />
          </div>
          <IncidentCenter
            incidents={incidents}
            onView={() => navigate("/obs/incidents")}
            onSelect={() => navigate("/obs/incidents")}
          />
        </section>

        {/* Live Stream + Activity */}
        <section
          className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up"
          style={{ animationDelay: "120ms" }}
        >
          <div className="xl:col-span-2">
            <LiveLogStream
              logs={logs}
              height={440}
              paused={paused}
              onTogglePause={() => setPaused((p) => !p)}
              onClear={() => setLogs([])}
            />
          </div>
          <ActivityFeed items={activity} />
        </section>

        {/* Charts */}
        <section
          className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="xl:col-span-2">
            <ThroughputChart {...throughput} />
          </div>
          <ServiceDistribution services={dist.services} values={dist.values} />
        </section>

        {/* Service Heatmap */}
        <section className="animate-slide-up" style={{ animationDelay: "240ms" }}>
          <ServiceHeatmap services={health} />
        </section>

        {/* Footer status bar */}
        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-t border-border">
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3 text-primary" /> Kafka lag: {cluster?.kafkaLag ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sev-success" />
            Flink: {cluster?.flinkHealthy ?? "—"}/{cluster?.flinkTotal ?? "—"} healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sev-success" />
            Elasticsearch: {cluster?.esStatus ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-ai" /> LLM cost / 24h: {cluster?.llmCost24h ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">DLQ depth: {cluster?.dlqDepth ?? "—"}</span>
          <span className="ml-auto">
            {cluster?.version ?? "v—"} · build {cluster?.build ?? "—"}
          </span>
        </footer>
      </div>
    </DashboardLayout>
  );
}