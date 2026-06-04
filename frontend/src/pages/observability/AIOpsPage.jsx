import { useEffect, useState } from "react";
import { DashboardLayout, AIOpsPanel } from "@/components/observability";
import { fetchAnomalies, fetchAIOpsStats, dismissAnomaly, dispatchAnomalyToSlack } from "@/api/api";

export default function AIOpsPage() {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats]         = useState(null);

  useEffect(() => {
    fetchAnomalies(10).then(setAnomalies).catch(() => {});
    fetchAIOpsStats().then(setStats).catch(() => {});
  }, []);

  const metrics = [
    { l: "Logs/min",      v: stats?.logsPerMin?.toLocaleString() ?? "—" },
    { l: "LLM Calls/min", v: stats?.llmCallsPerMin ?? "—" },
    { l: "Reduction",     v: stats ? `${stats.reductionPct}%` : "—" },
    { l: "Cost / 24h",    v: stats?.cost24h ?? "—" },
  ];

  return (
    <DashboardLayout title="AI Operations Center" subtitle="Groq · Llama 3 · Batched inference">
      <div className="p-6 max-w-[1800px] mx-auto space-y-6">
        <AIOpsPanel
          anomaly={anomalies[0]}
          onDismiss={(id) => dismissAnomaly(id).catch(() => {})}
          onDispatch={(id) => dispatchAnomalyToSlack(id).catch(() => {})}
        />
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-5">
          <h3 className="text-[13px] font-semibold mb-3">LLM Cost & Batching Strategy</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {metrics.map((m) => (
              <div key={m.l} className="p-4 rounded-lg border border-border bg-background/40">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  {m.l}
                </div>
                <div className="text-xl font-semibold text-gradient-ai">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
