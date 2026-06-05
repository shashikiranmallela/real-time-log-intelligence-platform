import { useEffect, useState, useCallback, useRef } from "react";
import { ShieldAlert, User, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { fetchIncidents, assignIncident, resolveIncident } from "@/api/api";
import { cn, timeAgo } from "@/lib/utils";

const statusStyle = {
  open:          "bg-sev-critical/15 text-sev-critical border-sev-critical/30",
  acknowledged:  "bg-sev-warn/15 text-sev-warn border-sev-warn/30",
  investigating: "bg-sev-warn/15 text-sev-warn border-sev-warn/30",
  mitigated:     "bg-sev-info/15 text-sev-info border-sev-info/30",
  resolved:      "bg-sev-success/15 text-sev-success border-sev-success/30",
  dismissed:     "bg-surface-2 text-muted-foreground border-border",
};

const sevDot = {
  critical: "bg-sev-critical", high: "bg-sev-critical",
  error:    "bg-sev-error",   medium: "bg-sev-warn",
  warn:     "bg-sev-warn",    info: "bg-sev-info",
  low:      "bg-muted-foreground", debug: "bg-muted-foreground",
};

// ── Single incident row — uses an uncontrolled input so focus is never lost ──
function IncidentRow({ inc, onAssigned, onResolved }) {
  const inputRef  = useRef(null);
  const [loading, setLoading] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAssign = async () => {
    const owner = (inputRef.current?.value || "").trim();
    if (!owner) { inputRef.current?.focus(); return; }
    setLoading("assign");
    try {
      await assignIncident(inc.incident_id || inc.id, owner);
      showToast(`Assigned to ${owner}`);
      onAssigned();
    } catch {
      showToast("Failed to assign", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleResolve = async () => {
    setLoading("resolve");
    try {
      await resolveIncident(inc.incident_id || inc.id);
      showToast("Resolved");
      onResolved();
    } catch {
      showToast("Failed to resolve", "error");
    } finally {
      setLoading(null);
    }
  };

  const sev    = (inc.severity || "warn").toLowerCase();
  const status = (inc.status   || "open").toLowerCase();
  const dimmed = status === "resolved" || status === "dismissed";

  return (
    <div className={cn("rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-5 space-y-3 relative", dimmed && "opacity-55")}>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg border text-[11px] font-medium shadow-md",
          toast.type === "error"
            ? "bg-sev-error/10 border-sev-error/30 text-sev-error"
            : "bg-sev-success/10 border-sev-success/30 text-sev-success",
        )}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("size-2 rounded-full shrink-0 mt-0.5", sevDot[sev] ?? "bg-muted-foreground")} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground">{inc.incident_id ?? inc.id}</span>
              <span className={cn("text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", statusStyle[status] ?? statusStyle.open)}>
                {status}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border bg-background/40 text-muted-foreground uppercase">
                {sev}
              </span>
            </div>
            <h3 className="text-[13px] font-semibold mt-0.5 leading-snug">{inc.title ?? inc.message ?? "—"}</h3>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{timeAgo(inc.openedAt)}</span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground">
        {inc.service && <span>Service: <span className="text-foreground/80">{inc.service}</span></span>}
        {inc.team    && <span>Team: <span className="text-foreground/80">{inc.team}</span></span>}
        {inc.owner   && <span>Owner: <span className="text-primary">{inc.owner}</span></span>}
      </div>

      {/* Actions */}
      {!dimmed && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          {/*
            IMPORTANT: this input is UNCONTROLLED (no value/onChange).
            We read its value via ref only on button click.
            This prevents React re-renders from stealing focus mid-typing.
          */}
          <input
            ref={inputRef}
            defaultValue={inc.owner ?? ""}
            placeholder="Assign to (name / handle)"
            onKeyDown={(e) => e.key === "Enter" && handleAssign()}
            className="flex-1 min-w-[180px] text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/20 outline-none"
          />
          <button
            onClick={handleAssign}
            disabled={!!loading}
            className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded border border-border bg-surface/60 hover:bg-surface-2 transition-colors disabled:opacity-40"
          >
            {loading === "assign" ? <Loader2 className="size-3 animate-spin" /> : <User className="size-3" />}
            Assign
          </button>
          <button
            onClick={handleResolve}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded bg-sev-success/10 border border-sev-success/30 text-sev-success hover:bg-sev-success/20 transition-colors disabled:opacity-40"
          >
            {loading === "resolve" ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);

  const load = useCallback(() =>
    fetchIncidents().then(setIncidents).catch(() => {}), []);

  useEffect(() => { load(); }, [load]);

  const active   = incidents.filter((i) => i.status !== "resolved" && i.status !== "dismissed");
  const resolved = incidents.filter((i) => i.status === "resolved" || i.status === "dismissed");

  return (
    <DashboardLayout title="Incidents" subtitle={`${active.length} active · ${resolved.length} resolved`}>
      <div className="p-6 max-w-[1800px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-sev-critical" />
            <span className="text-[13px] font-semibold">Incident Center</span>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors">
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground px-1">
            Active ({active.length})
          </h2>
          {active.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/40 p-8 text-center text-[11px] text-muted-foreground font-mono">No active incidents</div>
          ) : (
            active.map((inc) => (
              <IncidentRow key={inc.id} inc={inc} onAssigned={load} onResolved={load} />
            ))
          )}
        </div>

        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground px-1">
              Resolved / Dismissed ({resolved.length})
            </h2>
            {resolved.map((inc) => (
              <IncidentRow key={inc.id} inc={inc} onAssigned={load} onResolved={load} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
