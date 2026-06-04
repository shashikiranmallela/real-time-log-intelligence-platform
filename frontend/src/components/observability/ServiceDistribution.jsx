import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "oklch(0.78 0.16 195)",
  "oklch(0.72 0.22 305)",
  "oklch(0.78 0.16 75)",
  "oklch(0.72 0.18 155)",
  "oklch(0.68 0.22 30)",
  "oklch(0.72 0.14 230)",
  "oklch(0.62 0.18 340)",
  "oklch(0.78 0.10 100)",
];

/**
 * ServiceDistribution
 * Props:
 *  - services: string[]
 *  - values: number[]  (same length as services)
 */
export function ServiceDistribution({ services = [], values = [] }) {
  const { data, options, total } = useMemo(() => {
    const t = values.reduce((a, b) => a + b, 0);
    return {
      total: t,
      data: {
        labels: services,
        datasets: [
          {
            data: values,
            backgroundColor: PALETTE,
            borderColor: "oklch(0.18 0.014 260)",
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "oklch(0.18 0.014 260)",
            borderColor: "oklch(0.28 0.014 260)",
            borderWidth: 1,
            titleFont: { family: "JetBrains Mono", size: 11 },
            bodyFont: { family: "JetBrains Mono", size: 11 },
            padding: 10,
            cornerRadius: 6,
          },
        },
      },
    };
  }, [services, values]);

  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[12px] font-semibold tracking-tight">Traffic by Service</h3>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
          Last 5 minutes
        </p>
      </div>
      <div className="p-4 flex items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total</div>
            <div className="text-lg font-semibold tabular-nums">{(total / 1000).toFixed(1)}k</div>
            <div className="text-[9px] font-mono text-muted-foreground">msgs/min</div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10.5px]">
          {services.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 min-w-0">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="font-mono text-foreground/80 truncate">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
