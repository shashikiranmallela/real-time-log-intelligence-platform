import { Link, useLocation } from "react-router-dom";
import {
  Activity, AlertTriangle, Search, Bell, LayoutDashboard,
  Sparkles, Settings, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const defaultNav = [
  { to: "/obs",           label: "Overview",     icon: LayoutDashboard, exact: true },
  { to: "/obs/stream",    label: "Live Stream",  icon: Activity },
  { to: "/obs/anomalies", label: "Anomalies",    icon: AlertTriangle, badgeKey: "anomalies" },
  { to: "/obs/incidents", label: "Incidents",    icon: ShieldAlert, badgeKey: "incidents" },
  { to: "/obs/ai-ops",    label: "AI Operations",icon: Sparkles, ai: true },
  { to: "/obs/search",    label: "Search",       icon: Search },
  { to: "/obs/alerts",    label: "Alert Rules",  icon: Bell },
];

/**
 * Sidebar
 * Props:
 *  - badges?: { anomalies?: string|number, incidents?: string|number }
 *  - llm?:   { callsPerMin?, reductionPct?, progressPct? }
 *  - user?:  { initials?, name?, region? }
 */
export function Sidebar({ badges = {}, llm, user }) {
  const { pathname } = useLocation();
  const u = { initials: "SRE", name: "Operational Lead", region: "us-east-1-prod", ...(user || {}) };

  return (
    <aside className="w-[232px] shrink-0 border-r border-border bg-sidebar/60 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-5 pb-6">
        <Link to="/obs" className="flex items-center gap-2.5 group">
          <div className="relative size-8 rounded-lg bg-gradient-to-br from-primary to-ai flex items-center justify-center shadow-glow-ai">
            <div className="size-2 rounded-full bg-background" />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">Phantom</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              log.intel
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 space-y-0.5">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 mb-2">
          Monitor
        </div>
        {defaultNav.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname.startsWith(item.to);
          const Icon = item.icon;
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all relative",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
              )}
              <Icon
                className={cn(
                  "size-[15px] shrink-0",
                  item.ai && "text-ai",
                  active && !item.ai && "text-primary",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {badge !== undefined && badge !== null && (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                    item.label === "Anomalies"
                      ? "text-sev-critical bg-sev-critical/10 border-sev-critical/30"
                      : "text-sev-warn bg-sev-warn/10 border-sev-warn/30",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* LLM stats widget */}
      {llm && (
        <div className="p-3 mx-2.5 mb-3 rounded-lg border border-border bg-gradient-to-br from-ai/10 to-transparent">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="size-3.5 text-ai" />
            <span className="text-[11px] font-semibold text-gradient-ai">Groq LLM</span>
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight mb-2">
            {llm.callsPerMin ?? 0} calls/min · batched ·{" "}
            {(llm.reductionPct ?? 0).toFixed(1)}% saved vs per-line
          </div>
          <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ai to-primary rounded-full"
              style={{ width: `${llm.progressPct ?? 14}%` }}
            />
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="p-3 border-t border-border flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-gradient-to-br from-surface-3 to-surface-2 ring-1 ring-border flex items-center justify-center text-[10px] font-semibold">
          {u.initials}
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[12px] font-medium truncate">{u.name}</div>
          <div className="text-[10px] text-muted-foreground font-mono truncate">{u.region}</div>
        </div>
        <Settings className="size-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
      </div>
    </aside>
  );
}
