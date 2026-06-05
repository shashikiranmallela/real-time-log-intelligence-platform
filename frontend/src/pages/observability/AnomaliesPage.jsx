import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, Send, X, RefreshCw, Brain, Target, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { fetchAnomalies, dismissAnomaly, dispatchAnomalyToSlack, explainAnomaly } from "@/api/api";
import { cn, timeAgo } from "@/lib/utils";

const sevColor = {
  critical: "border-sev-critical/40 bg-sev-critical/[0.04]",
  high:     "border-sev-critical/30 bg-sev-critical/[0.03]",
  error:    "border-sev-error/40 bg-sev-error/[0.04]",
  medium:   "border-sev-warn/40 bg-sev-warn/[0.04]",
  warn:     "border-sev-warn/40 bg-sev-warn/[0.04]",
  info:     "border-sev-info/40 bg-sev-info/[0.04]",
  low:      "border-border bg-surface/40",
  debug:    "border-border bg-surface/40",
};

const sevBadge = {
  critical: "bg-sev-critical/15 text-sev-critical border-sev-critical/30",
  high:     "bg-sev-critical/10 text-sev-critical border-sev-critical/20",
  error:    "bg-sev-error/15 text-sev-error border-sev-error/30",
  medium:   "bg-sev-warn/15 text-sev-warn border-sev-warn/30",
  warn:     "bg-sev-warn/15 text-sev-warn border-sev-warn/30",
  info:     "bg-sev-info/15 text-sev-info border-sev-info/30",
  low:      "bg-surface-2 text-muted-foreground border-border",
  debug:    "bg-surface-2 text-muted-foreground border-border",
};

export default function AnomaliesPage() {
  const [anomalies,    setAnomalies]    = useState([]);
  const [explanations, setExplanations] = useState({});   // id → { text, rootCause, recommendation, source, loading }
  const [dispatching,  setDispatching]  = useState({});
  const [dismissing,   setDismissing]   = useState({});
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() =>
    fetchAnomalies(50).then(setAnomalies).catch(() => {}), []);

  useEffect(() => { load(); }, [load]);

  // Auto-load explanations for all anomalies — cache-first (no button press needed)
  // This is the smart batching strategy: fetch is only called once per unique signature
  useEffect(() => {
    if (anomalies.length === 0) return;
    anomalies.forEach((a) => {
      // Skip if already loaded or loading
      setExplanations((prev) => {
        if (prev[a.id]?.text || prev[a.id]?.loading) return prev;
        // Mark as loading
        const next = { ...prev, [a.id]: { loading: true } };
        // Fire the async fetch (cache-first on backend)
        explainAnomaly(a.id).then((data) => {
          setExplanations((p) => ({
            ...p,
            [a.id]: {
              loading:        false,
              text:           data.explanation,
              rootCause:      data.rootCause      || "See explanation above",
              recommendation: data.recommendation || "Review logs and escalate if needed.",
              source:         data.source,
            },
          }));
        }).catch(() => {
          setExplanations((p) => ({
            ...p,
            [a.id]: { loading: false, text: "Could not fetch AI explanation.", source: "error" },
          }));
        });
        return next;
      });
    });
  }, [anomalies]);

  const handleDismiss = async (id) => {
    setDismissing((prev) => ({ ...prev, [id]: true }));
    try {
      await dismissAnomaly(id);
      setAnomalies((prev) => prev.filter((a) => a.id !== id));
      showToast("Anomaly dismissed");
    } catch {
      showToast("Failed to dismiss", "error");
    } finally {
      setDismissing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDispatch = async (anomaly) => {
    const id = anomaly.id;
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

  const critical = anomalies.filter((a) => ["critical", "high"].includes(a.severity)).length;

  return (
    <DashboardLayout
      title="Anomalies"
      subtitle={`${anomalies.length} open · ${critical} critical · LLM-enriched`}
    >
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-[12px] font-medium shadow-lg backdrop-blur-sm animate-slide-up",
            toast.type === "error"
              ? "bg-sev-error/10 border-sev-error/30 text-sev-error"
              : "bg-sev-success/10 border-sev-success/30 text-sev-success",
          )}
        >
          {toast.msg}
        </div>
      )}

      <div className="p-6 space-y-4 max-w-[1800px] mx-auto">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono text-muted-foreground">
            Showing {anomalies.length} anomalies ·{" "}
            <span className="text-ai">AI explanations auto-loaded via smart cache</span>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>

        {anomalies.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/40 p-12 text-center text-[12px] text-muted-foreground font-mono">
            No open anomalies — system nominal
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((a) => {
              const sev  = (a.severity || "warn").toLowerCase();
              const expl = explanations[a.id];

              return (
                <div
                  key={a.id}
                  className={cn("rounded-xl border p-5 backdrop-blur-sm flex flex-col gap-3", sevColor[sev])}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", sevBadge[sev])}>
                        {sev}
                      </span>
                      <span className="text-[11px] font-mono text-foreground/80">{a.service}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(a.detectedAt)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[14px] font-semibold leading-snug">{a.title}</h3>

                  {/* AI Analysis — auto-loaded, no button needed */}
                  {!expl || expl.loading ? (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin text-ai" />
                      <span className="text-ai">Loading AI analysis…</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3 text-ai" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ai">AI Analysis</span>
                        <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                          {expl.source === "cache" ? "⚡ cached" : expl.source === "error" ? "⚠ error" : "✨ groq"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <ExplainCard icon={Brain}  label="Explanation"    color="ai"       body={expl.text} />
                        <ExplainCard icon={Target} label="Root Cause"     color="critical" body={expl.rootCause || "Under investigation"} />
                        <ExplainCard icon={Zap}    label="Recommendation" color="success"  body={expl.recommendation || "Review logs and escalate if needed."} />
                      </div>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <button
                      onClick={() => handleDispatch(a)}
                      disabled={dispatching[a.id]}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-gradient-to-r from-ai to-primary text-background font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {dispatching[a.id]
                        ? <><Loader2 className="size-3 animate-spin" /> Sending…</>
                        : <><Send className="size-3" /> Dispatch to Slack</>}
                    </button>
                    <button
                      onClick={() => handleDismiss(a.id)}
                      disabled={dismissing[a.id]}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors text-foreground/80 disabled:opacity-50"
                    >
                      {dismissing[a.id]
                        ? <><Loader2 className="size-3 animate-spin" /> Dismissing…</>
                        : <><X className="size-3" /> Dismiss</>}
                    </button>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{a.team ?? "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
