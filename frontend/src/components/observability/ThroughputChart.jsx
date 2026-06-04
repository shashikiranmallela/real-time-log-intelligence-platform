import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * ThroughputChart
 * Props:
 *  - labels: string[]
 *  - ingest: number[]
 *  - errors: number[]
 *  - anomalies: number[]
 */
export function ThroughputChart({ labels = [], ingest = [], errors = [], anomalies = [] }) {
  const { data, options } = useMemo(
    () => ({
      data: {
        labels,
        datasets: [
          {
            label: "Ingest (msgs/s)",
            data: ingest,
            borderColor: "oklch(0.78 0.16 195)",
            backgroundColor: (ctx) => {
              const { chart } = ctx;
              const area = chart.chartArea;
              if (!area) return "oklch(0.78 0.16 195 / 0.1)";
              const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, "oklch(0.78 0.16 195 / 0.35)");
              g.addColorStop(1, "oklch(0.78 0.16 195 / 0)");
              return g;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1.8,
            yAxisID: "y",
          },
          {
            label: "Errors",
            data: errors,
            borderColor: "oklch(0.68 0.22 30)",
            backgroundColor: "oklch(0.68 0.22 30 / 0.1)",
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1.5,
            yAxisID: "y1",
          },
          {
            label: "Anomalies",
            data: anomalies,
            borderColor: "oklch(0.72 0.22 305)",
            backgroundColor: "oklch(0.72 0.22 305 / 0.1)",
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 3],
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: "oklch(0.62 0.018 260)",
              boxWidth: 8,
              boxHeight: 8,
              font: { size: 10, family: "JetBrains Mono" },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "oklch(0.18 0.014 260)",
            borderColor: "oklch(0.28 0.014 260)",
            borderWidth: 1,
            titleColor: "oklch(0.97 0.005 260)",
            bodyColor: "oklch(0.85 0.01 260)",
            titleFont: { family: "JetBrains Mono", size: 11 },
            bodyFont: { family: "JetBrains Mono", size: 11 },
            padding: 10,
            cornerRadius: 6,
            displayColors: true,
            boxPadding: 4,
          },
        },
        scales: {
          x: {
            grid: { color: "oklch(0.28 0.014 260 / 0.4)", drawTicks: false },
            ticks: {
              color: "oklch(0.55 0.015 260)",
              font: { size: 9, family: "JetBrains Mono" },
              maxTicksLimit: 8,
              autoSkipPadding: 16,
            },
            border: { display: false },
          },
          y: {
            position: "left",
            grid: { color: "oklch(0.28 0.014 260 / 0.4)", drawTicks: false },
            ticks: { color: "oklch(0.55 0.015 260)", font: { size: 9, family: "JetBrains Mono" } },
            border: { display: false },
          },
          y1: {
            position: "right",
            grid: { display: false },
            ticks: { color: "oklch(0.55 0.015 260)", font: { size: 9, family: "JetBrains Mono" } },
            border: { display: false },
          },
        },
      },
    }),
    [labels, ingest, errors, anomalies],
  );

  return (
    <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold tracking-tight">Throughput & Error Trends</h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Last 60 minutes · live · 1m resolution
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <span className="size-1.5 rounded-full bg-sev-success animate-pulse" /> Live
        </div>
      </div>
      <div className="p-4 h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
