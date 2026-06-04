import { useEffect, useState } from "react";
import { Bell, Slack, Mail } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { fetchAlertRules, toggleAlertRule } from "@/api/api";

const ICON = { Slack, Email: Mail, PagerDuty: Bell };

export default function AlertsPage() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    fetchAlertRules().then(setRules).catch(() => {});
  }, []);

  const onToggle = (id, enabled) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    toggleAlertRule(id, enabled).catch(() => {});
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <DashboardLayout title="Alert Rules" subtitle={`Routing engine · ${activeCount} active rules`}>
      <div className="p-6 max-w-[1800px] mx-auto space-y-3">
        {rules.map((r) => {
          const Icon = ICON[r.channel] || Bell;
          return (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-4 flex items-center gap-4"
            >
              <div className="size-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{r.name}</div>
                <div className="text-[11px] font-mono text-muted-foreground truncate">{r.condition}</div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
                cooldown {r.cooldown}
              </div>
              <button
                onClick={() => onToggle(r.id, !r.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  r.enabled ? "bg-primary" : "bg-surface-3"
                }`}
              >
                <span
                  className={`inline-block size-3.5 bg-background rounded-full transition-transform ${
                    r.enabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
