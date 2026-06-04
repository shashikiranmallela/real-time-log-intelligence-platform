import { cn } from "@/lib/utils";

function cellColor(h) {
  if (h >= 95) return "bg-sev-success/80";
  if (h >= 85) return "bg-sev-success/40";
  if (h >= 70) return "bg-sev-warn/60";
  if (h >= 50) return "bg-sev-error/60";
  return "bg-sev-critical/80";
}

/**
 * ServiceHeatmap
 * Props:
 *  - services: Array<{ service, health (0..100), rps, p95, cells: number[] (24 values 0..100) }>
 */
export function ServiceHeatmap({ services = [] }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold tracking-tight">Service Health Heatmap</h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Last 24 minutes · per service · 1m buckets
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-sev-success/80" /> ok
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-sev-warn/60" /> deg
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-sev-critical/80" /> crit
          </span>
        </div>
      </div>

      <div className="p-4 space-y-1.5">
        {services.map((s) => {
          const cells = s.cells || [];
          return (
            <div key={s.service} className="flex items-center gap-3 group">
              <div className="w-28 shrink-0">
                <div className="text-[11.5px] font-mono text-foreground/80 truncate">{s.service}</div>
              </div>
              <div
                className="flex-1 grid gap-[2px]"
                style={{ gridTemplateColumns: `repeat(${cells.length || 24}, minmax(0, 1fr))` }}
              >
                {cells.map((c, i) => (
                  <div
                    key={i}
                    className={cn("h-5 rounded-[2px] transition-transform hover:scale-110 hover:z-10", cellColor(c))}
                    title={`${s.service} · ${c}% healthy`}
                  />
                ))}
              </div>
              <div className="w-20 shrink-0 flex justify-end gap-2 text-[10.5px] font-mono">
                <span className="text-muted-foreground tabular-nums">
                  {(s.rps || 0).toLocaleString()}rps
                </span>
              </div>
              <div className="w-16 shrink-0 text-right">
                <span
                  className={cn(
                    "text-[11px] font-mono font-semibold tabular-nums",
                    s.health >= 90
                      ? "text-sev-success"
                      : s.health >= 75
                      ? "text-sev-warn"
                      : "text-sev-critical",
                  )}
                >
                  {s.health}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
