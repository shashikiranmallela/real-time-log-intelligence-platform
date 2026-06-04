import { Sparkles, ChevronRight, Brain, Zap, Target } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";

/**
 * AIOpsPanel — AI anomaly analysis card.
 * Props:
 *  - anomaly: { id, service, severity, title, detectedAt, llmExplanation,
 *               rootCause, recommendation, confidence (0..1), affectedLogs }
 *  - meta?: { cost?, tokens?, latencyMs? }
 *  - onDismiss?: (id) => void
 *  - onDispatch?: (id) => void
 */
export function AIOpsPanel({ anomaly, meta, onDismiss, onDispatch }) {
  if (!anomaly) return null;
  const a = anomaly;
  const m = { cost: "$0.00", tokens: 0, latencyMs: 0, ...(meta || {}) };

  return (
    <div className="rounded-xl border border-ai/30 bg-gradient-to-br from-ai/[0.06] via-surface/60 to-surface/30 backdrop-blur-sm overflow-hidden relative glow-ai">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-ai/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative px-5 py-3 border-b border-ai/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-ai/15 border border-ai/30 flex items-center justify-center">
            <Sparkles className="size-3 text-ai" />
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold text-gradient-ai">AI Operations Center</div>
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
              Groq · Llama 3 · Batched Inference
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-ai uppercase tracking-widest flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-ai animate-pulse" /> analyzing
        </span>
      </div>

      {/* Body */}
      <div className="relative p-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sev-critical/15 text-sev-critical border border-sev-critical/30 uppercase tracking-widest">
              {a.severity}
            </span>
            <span className="text-[11px] font-mono text-foreground/70">{a.service}</span>
            <span className="text-[10px] text-muted-foreground">· {timeAgo(a.detectedAt)}</span>
            <span className="text-[10px] text-muted-foreground">
              · {(a.affectedLogs || 0).toLocaleString()} logs
            </span>
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground leading-snug">
            {a.title}
          </h3>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Confidence
          </div>
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ai to-primary rounded-full transition-all duration-1000"
              style={{ width: `${(a.confidence ?? 0) * 100}%` }}
            />
          </div>
          <div className="text-[12px] font-mono font-semibold text-ai tabular-nums">
            {Math.round((a.confidence ?? 0) * 100)}%
          </div>
        </div>

        {/* Analysis sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Section icon={Brain}  label="Explanation"     color="ai"       body={a.llmExplanation} />
          <Section icon={Target} label="Root Cause"      color="critical" body={a.rootCause} />
          <Section icon={Zap}    label="Recommendation"  color="success"  body={a.recommendation} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span className="text-ai">⊙</span> Cost: {m.cost} · {m.tokens} tokens · {m.latencyMs}ms
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDismiss && onDismiss(a.id)}
              className="text-[11px] px-3 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors text-foreground/80"
            >
              Dismiss
            </button>
            <button
              onClick={() => onDispatch && onDispatch(a.id)}
              className="text-[11px] px-3 py-1.5 rounded-md bg-gradient-to-r from-ai to-primary text-background font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Dispatch to Slack <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, body, color }) {
  const colorMap = {
    ai:       "text-ai border-ai/20 bg-ai/[0.04]",
    critical: "text-sev-critical border-sev-critical/20 bg-sev-critical/[0.04]",
    success:  "text-sev-success border-sev-success/20 bg-sev-success/[0.04]",
  };
  const cls = colorMap[color];
  return (
    <div className={cn("rounded-lg border p-3", cls)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("size-3", cls.split(" ")[0])} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-widest", cls.split(" ")[0])}>
          {label}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-foreground/80">{body}</p>
    </div>
  );
}
