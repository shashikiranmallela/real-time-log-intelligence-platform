import { useEffect, useState } from "react";
import { DashboardLayout, AIOpsPanel } from "@/components/observability";
import { fetchAnomalies, dismissAnomaly, dispatchAnomalyToSlack } from "@/api/api";
import { cn, timeAgo } from "@/lib/utils";

const sevColor = {
  critical: "border-sev-critical/40 bg-sev-critical/[0.04]",
  error:    "border-sev-error/40 bg-sev-error/[0.04]",
  warn:     "border-sev-warn/40 bg-sev-warn/[0.04]",
  info:     "border-sev-info/40 bg-sev-info/[0.04]",
  debug:    "border-border bg-surface/40",
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState([]);

  const load = () => fetchAnomalies(50).then(setAnomalies).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleDismiss  = (id) => dismissAnomaly(id).then(load).catch(() => {});
  const handleDispatch = (id) => dispatchAnomalyToSlack(id).catch(() => {});

  const critical = anomalies.filter((a) => a.severity === "critical").length;

  return (
    <DashboardLayout
      title="Anomalies"
      subtitle={`${anomalies.length} open · ${critical} critical · LLM-enriched`}
    >
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        <AIOpsPanel
          anomaly={anomalies[0]}
          onDismiss={handleDismiss}
          onDispatch={handleDispatch}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((a) => (
            <div
              key={a.id}
              className={cn("rounded-xl border p-5 backdrop-blur-sm", sevColor[a.severity])}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border bg-background/40">
                    {a.severity}
                  </span>
                  <span className="text-[11px] font-mono text-foreground/80">{a.service}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(a.detectedAt)}</span>
              </div>
              <h3 className="text-[14px] font-semibold mb-3">{a.title}</h3>
              <p className="text-[12px] text-foreground/75 leading-relaxed mb-3">{a.llmExplanation}</p>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Recommended action
              </div>
              <p className="text-[11.5px] text-foreground/85">{a.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
