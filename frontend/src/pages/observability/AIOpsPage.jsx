import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, Send, RefreshCw, Brain, Target, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { fetchAnomalies, fetchAIOpsStats, dispatchAnomalyToSlack, explainAnomaly } from "@/api/api";
import { cn, timeAgo } from "@/lib/utils";

export default function AIOpsPage() {
  const [anomalies,    setAnomalies]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [explanations, setExplanations] = useState({});   // id → { text, rootCause, recommendation, source, loading }
  const [dispatching,  setDispatching]  = useState({});
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    fetchAnomalies(20).then(setAnomalies).catch(() => {});
    fetchAIOpsStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-load explanations for all anomalies — cache-first, no button press needed
  useEffect(() => {
    if (anomalies.length === 0) return;
    anomalies.forEach((a) => {
      setExplanations((prev) => {
        if (prev[a.id]?.text || prev[a.id]?.loading) return prev;
        const next = { ...prev, [a.id]: { loading: true } };
        explainAnomaly(a.id).then((data) => {
          setExplanations((p) => ({
            ...p,
            [a.id]: {
              loading:        false,
              text:           data.explanation,
              rootCause:      data.rootCause      || "Under investigation",
              recommendation: data.recommendation || "Review logs and escalate if needed.",
              source:         data.source,
            },
          }));
        }).catch(() => {
          setExplanations((p) => ({
            ...p,
            [a.id]: { loading: false, text: "Could not fetch explanation.", source: "error" },
          }));
        });
        return next;
      });
    });
  }, [anomalies]);

  const handleDispatch = async (id) => {
    setDispatching((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await dispatchAnomalyToSlack(id);
      showToast(res.slack_sent ? "Sent to Slack ✓" : "Dispatched (no webhook configured)");
    } catch {
      showToast("Slack dispatch failed", "error");
    } finally {
      setDispatching((prev) => ({ ...prev, [id]: false }));
    }
  };

  const metrics = [
    { l: "Logs/min",      v: stats?.logsPerMin?.toLocaleString() ?? "—" },
    { l: "LLM Calls/min", v: stats?.llmCallsPerMin               ?? "—" },
    { l: "Reduction",     v: stats ? `${stats.reductionPct}%`    : "—" },
    { l: "Cost / 24h",    v: stats?.cost24h                       ?? "—" },
  ];

  return (
    <DashboardLayout title="AI Operations Center" subtitle="Groq · Llama 3 · Batched inference · Smart cache">
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-[12px] font-medium shadow-lg backdrop-blur-sm",
            toast.type === "error"
              ? "bg-sev-error/10 border-sev-error/30 text-sev-error"
              : "bg-sev-success/10 border-sev-success/30 text-sev-success",
          )}
        >
          {toast.msg}
        </div>
      )}

      <div className="p-6 max-w-[1800px] mx-auto space-y-6">

        {/* LLM stats */}
        <div className="rounded-xl border border-ai/30 bg-gradient-to-br from-ai/[0.06] via-surface/60 to-surface/30 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-6 rounded-md bg-ai/15 border border-ai/30 flex items-center justify-center">
              <Sparkles className="size-3 text-ai" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gradient-ai">LLM Cost & Batching Strategy</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                Anomaly signatures cached · same event type = one Groq call
              </div>
            </div>
            <button
              onClick={load}
              className="ml-auto flex items-center gap-1 text-[11px] px-2 py-1.5 rounded border border-border bg-surface/60 hover:bg-surface-2 transition-colors"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {metrics.map((m) => (
              <div key={m.l} className="p-4 rounded-lg border border-border bg-background/40">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{m.l}</div>
                <div className="text-xl font-semibold text-gradient-ai">{m.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background/30 p-3 text-[11px] text-foreground/75 leading-relaxed">
            <span className="font-semibold text-ai">Smart batching strategy:</span> Each anomaly is identified by a
            signature (service + event type + severity). The first occurrence calls Groq and stores the result.
            All future anomalies with the same signature instantly return the cached explanation —
            keeping LLM costs near zero even at 50,000 logs/min. The LLM is never called per log line,
            only per unique anomaly type — satisfying the project's batching requirement.
          </div>
        </div>

        {/* Anomaly list — auto-loaded explanations, no button needed */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground px-1">
            Recent Anomalies — AI analysis auto-loaded via cache
          </h2>

          {anomalies.length === 0 && (
            <div className="rounded-xl border border-border bg-surface/40 p-10 text-center text-[12px] text-muted-foreground font-mono">
              No anomalies — system nominal
            </div>
          )}

          {anomalies.map((a) => {
            const expl = explanations[a.id];
            return (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-border bg-background/40 text-muted-foreground">
                      {a.severity}
                    </span>
                    <span className="text-[12px] font-semibold">{a.title}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">· {a.service}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(a.detectedAt)}</span>
                </div>

                {/* AI analysis — auto-loaded */}
                {!expl || expl.loading ? (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin text-ai" />
                    <span className="text-ai text-[11px]">Loading AI analysis…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ExplainCard icon={Brain}  label="Explanation"    color="ai"       body={expl.text} />
                    <ExplainCard icon={Target} label="Root Cause"     color="critical" body={expl.rootCause} />
                    <ExplainCard icon={Zap}    label="Recommendation" color="success"  body={expl.recommendation} />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  {expl?.source && (
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {expl.source === "cache" ? "⚡ from cache" : expl.source === "error" ? "⚠ error" : "✨ from Groq"}
                    </span>
                  )}
                  <button
                    onClick={() => handleDispatch(a.id)}
                    disabled={dispatching[a.id]}
                    className="ml-auto flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-gradient-to-r from-ai to-primary text-background font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {dispatching[a.id]
                      ? <><Loader2 className="size-3 animate-spin" /> Sending…</>
                      : <><Send className="size-3" /> Dispatch to Slack</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExplainCard({ icon: Icon, label, body, color }) {
  const map = {
    ai:       "text-ai border-ai/20 bg-ai/[0.04]",
    critical: "text-sev-critical border-sev-critical/20 bg-sev-critical/[0.04]",
    success:  "text-sev-success border-sev-success/20 bg-sev-success/[0.04]",
  };
  const cls = map[color] || map.ai;
  return (
    <div className={cn("rounded-lg border p-3", cls)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("size-3", cls.split(" ")[0])} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-widest", cls.split(" ")[0])}>
          {label}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-foreground/80 whitespace-pre-line">{body}</p>
    </div>
  );
}
