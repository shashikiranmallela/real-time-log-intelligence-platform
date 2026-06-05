import { useEffect, useState, useRef } from "react";
import { Bell, Slack, Mail, Plus, X, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { DashboardLayout } from "@/components/observability";
import { fetchAlertRules, toggleAlertRule } from "@/api/api";
import { cn } from "@/lib/utils";

const ICON = { Slack, Email: Mail, PagerDuty: Bell };

const sevBadge = {
  HIGH:     "bg-sev-critical/10 text-sev-critical border-sev-critical/30",
  MEDIUM:   "bg-sev-warn/10 text-sev-warn border-sev-warn/30",
  LOW:      "bg-sev-info/10 text-sev-info border-sev-info/30",
  CRITICAL: "bg-sev-critical/15 text-sev-critical border-sev-critical/40",
};

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const CHANNELS   = ["Slack", "Email", "PagerDuty"];
const SERVICES   = ["*", "auth-service", "payment-service", "order-service"];

// Webhook targets stored per-session
const WH_KEY = "__phantom_webhooks__";
function loadWebhooks() {
  try { return JSON.parse(sessionStorage.getItem(WH_KEY) || "[]"); } catch { return []; }
}
function saveWebhooks(arr) {
  try { sessionStorage.setItem(WH_KEY, JSON.stringify(arr)); } catch {}
}

export default function AlertsPage() {
  const [rules,      setRules]      = useState([]);
  const [toggling,   setToggling]   = useState({});
  const [toast,      setToast]      = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [webhooks,   setWebhooks]   = useState(loadWebhooks);
  const [showWh,     setShowWh]     = useState(false);
  const whInputRef = useRef(null);
  const whNameRef  = useRef(null);

  // New rule form state
  const [newRule, setNewRule] = useState({
    name: "", condition: "", channel: "Slack", severity: "HIGH",
    service: "*", cooldown: "5m", threshold: 1000,
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchAlertRules().then(setRules).catch(() => {});
  }, []);

  const onToggle = async (id, enabled) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    setToggling((prev) => ({ ...prev, [id]: true }));
    try {
      await toggleAlertRule(id, enabled);
      showToast(enabled ? "Rule enabled" : "Rule disabled");
    } catch {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)));
      showToast("Failed to update rule", "error");
    } finally {
      setToggling((prev) => ({ ...prev, [id]: false }));
    }
  };

  const addRule = () => {
    if (!newRule.name.trim()) { showToast("Rule name is required", "error"); return; }
    const rule = {
      ...newRule,
      id:      `rule-${Date.now()}`,
      enabled: true,
      condition: newRule.condition || `${newRule.service} · severity ≥ ${newRule.severity}`,
    };
    setRules((prev) => [...prev, rule]);
    setNewRule({ name: "", condition: "", channel: "Slack", severity: "HIGH", service: "*", cooldown: "5m", threshold: 1000 });
    setShowAdd(false);
    showToast("Rule added");
  };

  const deleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    showToast("Rule deleted");
  };

  const addWebhook = () => {
    const url  = whInputRef.current?.value?.trim();
    const name = whNameRef.current?.value?.trim() || "Slack Webhook";
    if (!url) { showToast("Enter a webhook URL", "error"); return; }
    const next = [...webhooks, { id: Date.now(), name, url }];
    setWebhooks(next); saveWebhooks(next);
    if (whInputRef.current)  whInputRef.current.value  = "";
    if (whNameRef.current)   whNameRef.current.value   = "";
    showToast("Webhook saved");
  };

  const deleteWebhook = (id) => {
    const next = webhooks.filter((w) => w.id !== id);
    setWebhooks(next); saveWebhooks(next);
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <DashboardLayout title="Alert Rules" subtitle={`Routing engine · ${activeCount} active rules · ${webhooks.length} webhooks`}>
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-[12px] font-medium shadow-lg backdrop-blur-sm",
            toast.type === "error"
              ? "bg-sev-error/10 border-sev-error/30 text-sev-error"
              : "bg-sev-success/10 border-sev-success/30 text-sev-success",
          )}
        >
          {toast.msg}
        </div>
      )}

      <div className="p-6 max-w-[1800px] mx-auto space-y-4">

        {/* Slack webhook config panel */}
        <div className="rounded-xl border border-ai/20 bg-ai/[0.04] backdrop-blur-sm overflow-hidden">
          <button
            onClick={() => setShowWh((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <span className="text-[12px] font-semibold text-ai">Slack Webhook Targets</span>
              <span className="ml-2 text-[10px] font-mono text-muted-foreground">{webhooks.length} configured</span>
            </div>
            {showWh ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          {showWh && (
            <div className="border-t border-ai/20 px-4 py-4 space-y-3">
              <p className="text-[11px] text-foreground/70">
                Add webhook URLs here and in <code className="font-mono bg-surface-2 px-1 rounded">SLACK_WEBHOOK_URL</code> in your <code className="font-mono bg-surface-2 px-1 rounded">.env</code> file.
                Alerts are dispatched automatically when anomalies are detected.
              </p>
              {/* Webhook list */}
              {webhooks.length > 0 && (
                <div className="space-y-2">
                  {webhooks.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 text-[11px] font-mono px-3 py-2 rounded border border-border bg-background/40">
                      <Slack className="size-3 text-ai shrink-0" />
                      <span className="text-foreground/80 shrink-0">{w.name}:</span>
                      <span className="text-muted-foreground truncate flex-1">{w.url}</span>
                      <button onClick={() => deleteWebhook(w.id)} className="text-muted-foreground hover:text-sev-error shrink-0">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add webhook */}
              <div className="flex gap-2">
                <input ref={whNameRef} defaultValue="" placeholder="Name (e.g. #alerts)" className="text-[11px] font-mono w-36 px-2.5 py-1.5 rounded border border-border bg-background/60 placeholder:text-muted-foreground focus:border-primary/60 outline-none" />
                <input ref={whInputRef} defaultValue="" placeholder="https://hooks.slack.com/services/…" className="text-[11px] font-mono flex-1 px-2.5 py-1.5 rounded border border-border bg-background/60 placeholder:text-muted-foreground focus:border-primary/60 outline-none" />
                <button onClick={addWebhook} className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded border border-ai/40 bg-ai/10 text-ai hover:bg-ai/20 transition-colors whitespace-nowrap">
                  <Save className="size-3" /> Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono text-muted-foreground">
            {rules.length} rules · {activeCount} active
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="size-3" /> Add Rule
          </button>
        </div>

        {/* Add rule form */}
        {showAdd && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
            <h3 className="text-[12px] font-semibold">New Alert Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rule Name *</label>
                <input
                  value={newRule.name}
                  onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. High Error Rate"
                  className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Condition</label>
                <input
                  value={newRule.condition}
                  onChange={(e) => setNewRule((p) => ({ ...p, condition: e.target.value }))}
                  placeholder="e.g. error_rate > 5% in 1m"
                  className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Service</label>
                <select value={newRule.service} onChange={(e) => setNewRule((p) => ({ ...p, service: e.target.value }))} className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none">
                  {SERVICES.map((s) => <option key={s} value={s}>{s === "*" ? "All services" : s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Severity</label>
                <select value={newRule.severity} onChange={(e) => setNewRule((p) => ({ ...p, severity: e.target.value }))} className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none">
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Channel</label>
                <select value={newRule.channel} onChange={(e) => setNewRule((p) => ({ ...p, channel: e.target.value }))} className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none">
                  {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cooldown</label>
                <input
                  value={newRule.cooldown}
                  onChange={(e) => setNewRule((p) => ({ ...p, cooldown: e.target.value }))}
                  placeholder="e.g. 5m"
                  className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded border border-border bg-background/60 focus:border-primary/60 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addRule} className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 rounded-md bg-primary text-background font-semibold hover:opacity-90 transition-opacity">
                <Plus className="size-3" /> Add Rule
              </button>
              <button onClick={() => setShowAdd(false)} className="text-[11px] px-3 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface-2 transition-colors text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rules list */}
        <div className="space-y-3">
          {rules.map((r) => {
            const Icon = ICON[r.channel] || Bell;
            return (
              <div
                key={r.id}
                className={cn(
                  "rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-4 flex items-center gap-4 transition-opacity",
                  !r.enabled && "opacity-50",
                )}
              >
                <div className="size-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold">{r.name}</span>
                    <span className={cn("text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", sevBadge[r.severity] ?? sevBadge.MEDIUM)}>
                      {r.severity}
                    </span>
                    {r.service && r.service !== "*" && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border bg-background/40 text-muted-foreground">
                        {r.service}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground truncate">{r.condition}</div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">{r.channel}</div>
                <div className="text-[10px] font-mono text-muted-foreground shrink-0">cooldown {r.cooldown}</div>
                <button
                  onClick={() => onToggle(r.id, !r.enabled)}
                  disabled={toggling[r.id]}
                  aria-label={r.enabled ? "Disable rule" : "Enable rule"}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 shrink-0",
                    r.enabled ? "bg-primary" : "bg-surface-3",
                  )}
                >
                  <span className={cn("inline-block size-3.5 bg-background rounded-full transition-transform", r.enabled ? "translate-x-5" : "translate-x-1")} />
                </button>
                {/* Delete */}
                <button
                  onClick={() => deleteRule(r.id)}
                  className="text-muted-foreground hover:text-sev-error transition-colors shrink-0"
                  title="Delete rule"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
          {rules.length === 0 && (
            <div className="rounded-xl border border-border bg-surface/40 p-10 text-center text-[12px] text-muted-foreground font-mono">
              No rules — click <span className="text-primary">Add Rule</span> to create one
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-border bg-surface/40 p-4 text-[11px] text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground/80 mb-1">How alert routing works</p>
          <p>
            The Kafka consumer detects anomalies using z-score + IQR statistical methods with per-service adaptive baselines.
            When a threshold is exceeded, an alert is written to Elasticsearch and a Slack notification is dispatched automatically.
            Rules are matched by service and severity. Cooldown prevents duplicate alerts for the same service within the configured window.
            Toggle rules to enable/disable channels. Add new rules to customize routing per service and escalation chain.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
