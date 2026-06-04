import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const to = Number(target) || 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

const accentMap = {
  primary:  { text: "text-primary",      bg: "bg-primary/10",      border: "border-primary/20" },
  ai:       { text: "text-ai",           bg: "bg-ai/10",           border: "border-ai/20" },
  warn:     { text: "text-sev-warn",     bg: "bg-sev-warn/10",     border: "border-sev-warn/20" },
  critical: { text: "text-sev-critical", bg: "bg-sev-critical/10", border: "border-sev-critical/20" },
  success:  { text: "text-sev-success",  bg: "bg-sev-success/10",  border: "border-sev-success/20" },
  info:     { text: "text-sev-info",     bg: "bg-sev-info/10",     border: "border-sev-info/20" },
};

/**
 * MetricCard — animated KPI card with optional sparkline.
 * Props: label, value, format?, unit?, trend?, trendDir?, icon, accent?, spark?
 */
export function MetricCard({
  label,
  value = 0,
  format,
  unit,
  trend,
  trendDir = "up-good",
  icon: Icon,
  accent = "primary",
  spark,
}) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString();
  const colors = accentMap[accent] || accentMap.primary;

  const trendUp = trend > 0;
  const trendGood = trendDir === "up-good" ? trendUp : !trendUp;
  const trendColor =
    trend === 0 || trend == null
      ? "text-muted-foreground"
      : trendGood
      ? "text-sev-success"
      : "text-sev-critical";

  const maxSpark = spark ? Math.max(...spark, 1) : 1;

  return (
    <div className={cn("rounded-xl border p-4 bg-surface/40 backdrop-blur-sm flex flex-col gap-3", colors.border)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        {Icon && (
          <div className={cn("size-7 rounded-md flex items-center justify-center", colors.bg)}>
            <Icon className={cn("size-3.5", colors.text)} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className={cn("text-[26px] font-bold tabular-nums leading-none", colors.text)}>
            {display}
          </div>
          {unit && (
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{unit}</div>
          )}
        </div>
        {trend != null && (
          <div className={cn("flex items-center gap-0.5 text-[11px] font-mono font-medium mb-0.5", trendColor)}>
            {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      {spark && spark.length > 0 && (
        <div className="flex items-end gap-[2px] h-8">
          {spark.map((v, i) => (
            <div
              key={i}
              className={cn("flex-1 rounded-sm min-h-[2px] transition-all", colors.bg)}
              style={{
                height: `${Math.max(4, (v / maxSpark) * 100)}%`,
                opacity: 0.6 + (i / spark.length) * 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
