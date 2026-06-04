import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
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

export default function SearchPage() {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => {
      searchLogs(q, 200).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <DashboardLayout title="Log Search" subtitle="Full-text search · last 15 minutes">
      <div className="p-6 max-w-[1800px] mx-auto space-y-4">
        {/* Search input */}
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='service:auth-api severity:error "timeout"'
              className="w-full bg-background/60 border border-border rounded-lg py-3 pl-10 pr-4 text-[13px] font-mono placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["severity:error", "service:payment-engine", "last 1h", "status:5xx"].map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="text-[10px] font-mono px-2 py-1 rounded border border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-surface/60">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-mono text-foreground">{results.length}</span> results
            </span>
          </div>
          <div className="max-h-[640px] overflow-y-auto font-mono text-[11.5px] divide-y divide-border/40">
            {results.map((l) => (
              <div key={l.id} className="flex gap-4 px-4 py-2 hover:bg-surface-2/40">
                <span className="w-24 shrink-0 text-muted-foreground">{(l.ts || "").slice(11, 23)}</span>
                <span className="w-28 shrink-0 text-foreground/70">{l.service}</span>
                <span className={cn("w-16 shrink-0", sevStyles[l.severity])}>{l.severity}</span>
                <span className="flex-1 text-foreground/85 truncate">{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
