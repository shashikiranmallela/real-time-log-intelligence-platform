import { Activity, GitBranch, Cpu, ShieldCheck, AlertCircle } from "lucide-react";

const KIND_STYLE = {
  anomaly:    { icon: AlertCircle, color: "text-sev-critical", bg: "bg-sev-critical/10 border-sev-critical/30" },
  mitigation: { icon: ShieldCheck, color: "text-sev-success",  bg: "bg-sev-success/10 border-sev-success/30" },
  llm:        { icon: Cpu,         color: "text-ai",           bg: "bg-ai/10 border-ai/30" },
  deploy:     { icon: GitBranch,   color: "text-sev-info",     bg: "bg-sev-info/10 border-sev-info/30" },
  lag:        { icon: Activity,    color: "text-sev-warn",     bg: "bg-sev-warn/10 border-sev-warn/30" },
};

/**
 * ActivityFeed
 * Props:
 *  - items: Array<{ id, kind, title, detail, time }>
 *    kind ∈ "anomaly" | "mitigation" | "llm" | "deploy" | "lag"
 */
export function ActivityFeed({ items = [] }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-[12px] font-semibold tracking-tight">Activity Feed</h3>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Real-time
        </span>
      </div>
      <div className="p-4 space-y-3 relative">
        <div className="absolute left-[26px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        {items.map((item) => {
          const style = KIND_STYLE[item.kind] || KIND_STYLE.deploy;
          const Icon = style.icon;
          return (
            <div key={item.id} className="flex gap-3 relative">
              <div
                className={`size-6 shrink-0 rounded-md border ${style.bg} flex items-center justify-center z-10`}
              >
                <Icon className={`size-3 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-foreground truncate">{item.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{item.time}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">{item.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
