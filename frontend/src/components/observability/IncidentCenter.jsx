import { ShieldAlert, ChevronRight } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

const statusStyle = {
  open:          "bg-sev-critical/15 text-sev-critical border-sev-critical/30",
  investigating: "bg-sev-warn/15 text-sev-warn border-sev-warn/30",
  mitigated:     "bg-sev-info/15 text-sev-info border-sev-info/30",
  resolved:      "bg-sev-success/15 text-sev-success border-sev-success/30",
};

const sevDot = {
  critical: "bg-sev-critical",
  high:     "bg-sev-critical",
  error:    "bg-sev-error",
  medium:   "bg-sev-warn",
  warn:     "bg-sev-warn",
  info:     "bg-sev-info",
  debug:    "bg-muted-foreground",
};

export function IncidentCenter({ incidents = [], activeCount, onView, onSelect }) {
  const count =
    activeCount ?? incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-3.5 text-sev-critical" />
          <h3 className="text-[12px] font-semibold tracking-tight">Incident Center</h3>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {count} active
          </span>
        </div>
        {onView && (
          <button
            onClick={onView}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All incidents <ChevronRight className="size-3" />
          </button>
        )}
      </div>

      {/* List — max height matches AIOpsPanel, scrollable */}
      <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: "510px" }}>
        {incidents.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-muted-foreground font-mono">
            No active incidents
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelect && onSelect(inc)}
              className="px-4 py-3 hover:bg-surface-2/40 transition-colors cursor-pointer group flex items-center gap-3"
            >
              <span className={cn("size-2 rounded-full shrink-0", sevDot[(inc.severity || "").toLowerCase()] ?? "bg-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px]">
                    {inc.incident_id ?? inc.id}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0",
                      statusStyle[(inc.status || "").toLowerCase()] ?? statusStyle.open,
                    )}
                  >
                    {inc.status ?? "open"}
                  </span>
                </div>
                <div className="text-[12.5px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {inc.title ?? inc.message ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground font-mono mt-0.5 flex-wrap">
                  {inc.service  && <span>{inc.service}</span>}
                  {inc.team     && <><span>·</span><span>{inc.team}</span></>}
                  {inc.owner    && <><span>·</span><span className="text-primary">{inc.owner}</span></>}
                  {inc.openedAt && <><span>·</span><span>{timeAgo(inc.openedAt)}</span></>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
