import ServiceChart from "./components/ServiceChart";
import ErrorLevelChart from "./components/ErrorLevelChart";
import "./App.css";
import { useEffect, useState } from "react";

function App() {

  const [stats, setStats] = useState({
    total_logs: 0,
    error_logs: 0,
    anomalies_detected: 0
  });

  const [logs, setLogs] = useState([]);
  const [serviceData, setServiceData] = useState({});

  // Fetch stats
  const fetchStats = async () => {
    const response = await fetch("http://127.0.0.1:8000/stats");
    const data = await response.json();
    setStats(data);
  };

  // Fetch logs
  const fetchLogs = async () => {
    const response = await fetch("http://127.0.0.1:8000/logs");
    const data = await response.json();
    setLogs(data);
  };
  const fetchServiceDistribution = async () => {

    const response = await fetch(
      "http://127.0.0.1:8000/service-distribution"
    );

    const data = await response.json();

    setServiceData(data);
  };

  useEffect(() => {

    fetchStats();
    fetchLogs();
    fetchServiceDistribution();

    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
      fetchServiceDistribution();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="dashboard">

      <h1>🚀 Real-Time Log Intelligence Platform</h1>

      <div className="cards">

        <div className="card">
          <h2>Total Logs</h2>
          <p>{stats.total_logs}</p>
        </div>

        <div className="card">
          <h2>Error Logs</h2>
          <p>{stats.error_logs}</p>
        </div>

        <div className="card">
          <h2>Anomalies Detected</h2>
          <p>{stats.anomalies_detected}</p>
        </div>

      </div>

      {/* Service Distribution Pie Chart */}
      <div className="charts-container">

        <ServiceChart data={serviceData} />

        <ErrorLevelChart logs={logs} />

      </div>

      <div className="logs-section">

        <h2>Recent Logs</h2>

        <table>

          <thead>
            <tr>
              <th>Service</th>
              <th>Level</th>
              <th>Message</th>
              <th>Response Time</th>
            </tr>
          </thead>

          <tbody>

            {logs.map((log, index) => (

              <tr key={index}>

                <td>{log.service}</td>

                <td>{log.level}</td>

                <td>{log.message}</td>

                <td>{log.response_time} ms</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default App;