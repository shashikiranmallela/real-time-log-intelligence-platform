import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { searchLogs } from "@/api/api";
import { cn } from "@/lib/utils";

const sevStyles = {
  debug:    "text-muted-foreground",
  info:     "text-sev-info",
  warn:     "text-sev-warn",
  error:    "text-sev-error",
  critical: "text-sev-critical font-semibold",
};

const LEVELS   = ["", "INFO", "WARN", "ERROR", "CRITICAL", "DEBUG"];
const SERVICES = ["", "auth-service", "payment-service", "order-service"];

const QUICK_FILTERS = [
  { label: "Errors only",     params: { level: "ERROR" } },
  { label: "Critical",        params: { level: "CRITICAL" } },
  { label: "auth-service",    params: { service: "auth-service" } },
  { label: "payment-service", params: { service: "payment-service" } },
  { label: "order-service",   params: { service: "order-service" } },
  { label: "Warnings",        params: { level: "WARN" } },
];

// Saved searches stored in-memory (per session)
const SAVED_SEARCHES_KEY = "__phantom_saved__";
function loadSaved() {
  try { return JSON.parse(sessionStorage.getItem(SAVED_SEARCHES_KEY) || "[]"); } catch { return []; }
}
function saveSaved(arr) {
  try { sessionStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(arr)); } catch {}
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read q from URL so global topbar search works
  const [q,        setQ]        = useState(searchParams.get("q") || "");
  const [level,    setLevel]    = useState("");
  const [service,  setService]  = useState("");
  const [fromTs,   setFromTs]   = useState("");
  const [toTs,     setToTs]     = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [saved,    setSaved]    = useState(loadSaved);
  const [expanded, setExpanded] = useState(null); // expanded row id

  const debounceRef = useRef(null);

  // When URL q param changes (e.g. topbar search), sync it
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    if (urlQ !== q) setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyQuick = (params) => {
    setQ(params.q       ?? q);
    setLevel(params.level   ?? "");
    setService(params.service ?? "");
  };

  const clearAll = () => {
    setQ(""); setLevel(""); setService(""); setFromTs(""); setToTs("");
    navigate("/obs/search");
  };

  const hasFilters = q || level || service || fromTs || toTs;

  const doSearch = useCallback(() => {
    setLoading(true);
    searchLogs({ q, level, service, from_ts: fromTs, to_ts: toTs }, 200)
      .then((data) => { setResults(data); setSearched(true); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, level, service, fromTs, toTs]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSearch, 300);
    return () => clearTimeout(debounceRef.current);
  }, [doSearch]);

  const saveSearch = () => {
    if (!hasFilters) return;
    const entry = { label: q || `${level || service || "filter"}`, q, level, service, fromTs, toTs, id: Date.now() };
    const next = [entry, ...saved].slice(0, 8);
    setSaved(next);
    saveSaved(next);
  };

  const loadSavedSearch = (s) => {
    setQ(s.q); setLevel(s.level); setService(s.service); setFromTs(s.fromTs); setToTs(s.toTs);
  };

  const deleteSaved = (id) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next); saveSaved(next);
  };

  return (
    <DashboardLayout title="Log Search" subtitle="Full-text search · Filters · Time range · Saved queries">
      <div className="p-6 max-w-[1800px] mx-auto space-y-4">

        {/* Search bar */}
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-4 space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search messages, e.g. "timeout", "connection refused", "payment failed"…'
              className="w-full bg-background/60 border border-border rounded-lg py-3 pl-10 pr-28 text-[13px] font-mono placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {hasFilters && (
                <button
                  onClick={saveSearch}
                  title="Save this search"
                  className="text-[10px] font-mono px-2 py-1 rounded border border-border bg-background/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  Save
                </button>
              )}
              {q && (
                <button onClick={() => { setQ(""); navigate("/obs/search"); }} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-background/60 text-foreground/80 focus:border-primary/60 outline-none cursor-pointer"
            >
              <option value="">All levels</option>
              {LEVELS.filter(Boolean).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-background/60 text-foreground/80 focus:border-primary/60 outline-none cursor-pointer"
            >
              <option value="">All services</option>
              {SERVICES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex items-center gap-1">
              <input
                type="datetime-local"
                value={fromTs}
                onChange={(e) => setFromTs(e.target.value)}
                title="From"
                className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-background/60 text-foreground/80 focus:border-primary/60 outline-none cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground">→</span>
              <input
                type="datetime-local"
                value={toTs}
                onChange={(e) => setToTs(e.target.value)}
                title="To"
                className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-background/60 text-foreground/80 focus:border-primary/60 outline-none cursor-pointer"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-[10px] font-mono px-2 py-1 rounded border border-border bg-background/40 text-muted-foreground hover:text-sev-error hover:border-sev-error/40 transition-colors flex items-center gap-1"
              >
                <X className="size-2.5" /> Clear all
              </button>
            )}
          </div>

          {/* Quick-filter chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground self-center">Quick:</span>
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => applyQuick(f.params)}
                className="text-[10px] font-mono px-2 py-1 rounded border border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saved searches */}
        {saved.length > 0 && (
          <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Saved Searches</div>
            <div className="flex flex-wrap gap-2">
              {saved.map((s) => (
                <div key={s.id} className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border border-border bg-background/40">
                  <button onClick={() => loadSavedSearch(s)} className="text-primary hover:underline">{s.label}</button>
                  <button onClick={() => deleteSaved(s.id)} className="text-muted-foreground hover:text-sev-error ml-1"><X className="size-2.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results table */}
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-surface/60 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {loading ? (
                <span className="animate-pulse">Searching…</span>
              ) : searched ? (
                <>
                  <span className="font-mono text-foreground">{results.length}</span> results
                  {hasFilters && <span className="ml-2 text-primary">filtered</span>}
                </>
              ) : (
                "Type to search logs"
              )}
            </span>
            {results.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">showing latest {results.length}</span>
            )}
          </div>

          <div className="px-4 py-1.5 border-b border-border bg-surface/30 flex gap-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="w-24">Time</span>
            <span className="w-28">Service</span>
            <span className="w-16">Level</span>
            <span className="flex-1">Message</span>
          </div>

          <div className="max-h-[600px] overflow-y-auto font-mono text-[11.5px] divide-y divide-border/40">
            {results.length === 0 && searched && !loading ? (
              <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">
                No logs matched your search.
              </div>
            ) : (
              results.map((l) => (
                <div key={l.id}>
                  <div
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    className="flex gap-4 px-4 py-2 hover:bg-surface-2/40 transition-colors cursor-pointer"
                  >
                    <span className="w-24 shrink-0 text-muted-foreground tabular-nums">
                      {(l.ts || "").slice(11, 23)}
                    </span>
                    <span className="w-28 shrink-0 text-foreground/70 truncate">{l.service}</span>
                    <span className={cn("w-16 shrink-0 uppercase", sevStyles[l.severity] ?? "text-muted-foreground")}>
                      {l.severity}
                    </span>
                    <span className="flex-1 text-foreground/85 truncate">{l.message}</span>
                  </div>
                  {/* Expanded row */}
                  {expanded === l.id && (
                    <div className="px-4 pb-3 bg-surface/60 text-[11px] font-mono text-foreground/70 space-y-1 border-t border-border/40">
                      <div><span className="text-muted-foreground">id:</span> {l.id}</div>
                      <div><span className="text-muted-foreground">timestamp:</span> {l.ts}</div>
                      <div><span className="text-muted-foreground">service:</span> {l.service}</div>
                      <div><span className="text-muted-foreground">level:</span> {l.severity}</div>
                      <div><span className="text-muted-foreground">message:</span> {l.message}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
