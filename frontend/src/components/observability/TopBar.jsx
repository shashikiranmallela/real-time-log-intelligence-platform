import { Command, Bell, Filter } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * TopBar
 * Props:
 *  - title: string
 *  - subtitle?: string
 *  - systemStatus?: { ok?: boolean, label?: string }
 *  - hasAlerts?: boolean
 *  - searchValue?: string
 *  - onSearchChange?: (value: string) => void
 */
export function TopBar({
  title,
  subtitle,
  systemStatus = { ok: true, label: "All Systems Operational" },
  hasAlerts = true,
  searchValue,
  onSearchChange,
}) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background/60 backdrop-blur-xl flex items-center px-6 gap-6 sticky top-0 z-20">
      <div className="flex flex-col leading-tight">
        <h1 className="text-[14px] font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground font-mono">{subtitle}</p>
        )}
      </div>

      <div className="flex-1 max-w-md ml-4">
        <div className="relative group">
          <Command className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search logs, services, traces…  ⌘K"
            className="w-full bg-surface/70 border border-border rounded-md py-1.5 pl-9 pr-3 text-[12.5px] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md border ${
            systemStatus.ok
              ? "bg-sev-success/10 border-sev-success/30"
              : "bg-sev-critical/10 border-sev-critical/30"
          }`}
        >
          <span className="relative inline-flex">
            <span
              className={`size-1.5 rounded-full pulse-dot ${
                systemStatus.ok
                  ? "bg-sev-success text-sev-success"
                  : "bg-sev-critical text-sev-critical"
              }`}
            />
          </span>
          <span
            className={`text-[10px] font-mono uppercase tracking-widest font-medium ${
              systemStatus.ok ? "text-sev-success" : "text-sev-critical"
            }`}
          >
            {systemStatus.label}
          </span>
        </div>

        <div className="hidden lg:block text-[11px] font-mono text-muted-foreground tabular-nums">
          {time.toISOString().slice(11, 19)} UTC
        </div>

        <button className="size-8 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors flex items-center justify-center">
          <Filter className="size-3.5 text-muted-foreground" />
        </button>
        <button className="size-8 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors flex items-center justify-center relative">
          <Bell className="size-3.5 text-muted-foreground" />
          {hasAlerts && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-sev-critical ring-2 ring-background" />
          )}
        </button>
      </div>
    </header>
  );
}
