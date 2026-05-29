import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function ServiceChart({ data }) {

  const chartData = {
    labels: Object.keys(data),

    datasets: [
      {
        label: "Logs",

        data: Object.values(data),

        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56"
        ],

        borderColor: "#ffffff",
        borderWidth: 2
      }
    ]
  };

  return (
    <div
        style={{
            background: "#182544",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            width: "500px",
            height: "340px",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        >
        <h2>Service Distribution</h2>

        <div
            style={{
            width: "280px",
            height: "280px",
            margin: "0 auto"
            }}
        >
            <Pie
            data={chartData}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                legend: {
                    labels: {
                    color: "white",
                    font: {
                        size: 14
                    }
                    }
                }
                }
            }}
            />
        </div>
    </div>
  );
}

export default ServiceChart;