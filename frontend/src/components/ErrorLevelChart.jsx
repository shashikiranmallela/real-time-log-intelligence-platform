import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function ErrorLevelChart({ logs }) {

  const levels = {
    INFO: 0,
    WARN: 0,
    ERROR: 0
  };

  logs.forEach((log) => {
    if (levels[log.level] !== undefined) {
      levels[log.level]++;
    }
  });

  const data = {
    labels: ["INFO", "WARN", "ERROR"],

    datasets: [
      {
        label: "Log Count",
        data: [
          levels.INFO,
          levels.WARN,
          levels.ERROR
        ],

        backgroundColor: [
          "#36A2EB",
          "#FFCE56",
          "#FF6384"
        ]
      }
    ]
  };

  return (
    <div
      style={{
        background: "#182544",
        padding: "15px",
        borderRadius: "10px",
        width: "450px",
        height: "280px"
    }}
    >
      <h2>Error Level Distribution</h2>

      <Bar
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: "white"
              }
            }
          }
        }}
      />
    </div>
  );
}

export default ErrorLevelChart;