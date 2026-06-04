import { useEffect, useRef, useState, useMemo } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sevStyles = {
  debug:    "text-muted-foreground",
  info:     "text-sev-info",
  warn:     "text-sev-warn",
  error:    "text-sev-error",
  critical: "text-sev-critical font-semibold",
};

const sevBg = {
  debug:    "",
  info:     "",
  warn:     "bg-sev-warn/[0.04]",
  error:    "bg-sev-error/[0.06]",
  critical: "bg-sev-critical/[0.08] border-l-2 border-sev-critical",
};

/**
 * LiveLogStream — fully props-driven live log tail.
 * Props:
 *  - logs: LogEntry[]
 *  - height?: number
 *  - paused?: boolean
 *  - onTogglePause?: () => void
 *  - onClear?: () => void
 *  - filter?: "all"|"info"|"warn"|"error"|"critical"
 *  - onFilterChange?: (filter) => void
 */
export function LiveLogStream({
  logs = [],
  height = 480,
  paused = false,
  onTogglePause,
  onClear,
  filter: filterProp,
  onFilterChange,
}) {
  const [internalFilter, setInternalFilter] = useState("all");
  const filter = filterProp ?? internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  const scrollerRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, paused]);

  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.severity === filter)),
    [logs, filter],
  );

  const counts = useMemo(
    () =>
      logs.reduce((acc, l) => {
        acc[l.severity] = (acc[l.severity] || 0) + 1;
        return acc;
      }, {}),
    [logs],
  );

  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                paused ? "bg-muted-foreground" : "bg-sev-success animate-pulse",
              )}
            />
            <h3 className="text-[12px] font-semibold tracking-tight">Live Stream</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {paused ? "paused" : "tailing"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {["all", "info", "warn", "error", "critical"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "text-[10px] font-mono uppercase px-2 py-1 rounded border transition-colors",
                filter === s
                  ? "bg-surface-2 text-foreground border-border-strong"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface",
              )}
            >
              {s}
              {s !== "all" && counts[s] ? (
                <span className="ml-1 opacity-60">{counts[s]}</span>
              ) : null}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={onTogglePause}
            className="size-7 rounded border border-border bg-surface hover:bg-surface-2 transition-colors flex items-center justify-center"
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
          </button>
          <button
            onClick={onClear}
            className="size-7 rounded border border-border bg-surface hover:bg-surface-2 transition-colors flex items-center justify-center"
            aria-label="Clear"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-4 py-1.5 border-b border-border bg-surface/30 flex gap-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="w-20">Time</span>
        <span className="w-28">Service</span>
        <span className="w-12">Level</span>
        <span className="flex-1">Message</span>
        <span className="w-20 text-right">Trace</span>
      </div>

      {/* Log rows */}
      <div ref={scrollerRef} className="overflow-y-auto font-mono text-[11.5px]" style={{ height }}>
        {filtered.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex gap-4 px-4 py-[3px] hover:bg-surface-2/60 transition-colors animate-log-enter group",
              sevBg[log.severity],
            )}
          >
            <span className="w-20 shrink-0 text-muted-foreground tabular-nums">
              {(log.ts || "").slice(11, 23)}
            </span>
            <span className="w-28 shrink-0 text-foreground/70 truncate">{log.service}</span>
            <span className={cn("w-12 shrink-0 uppercase tracking-wide", sevStyles[log.severity])}>
              {(log.severity || "").slice(0, 4)}
            </span>
            <span className="flex-1 text-foreground/90 truncate">{log.message}</span>
            <span className="w-20 text-right text-muted-foreground/60 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {log.traceId ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
