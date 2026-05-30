import AlertPanel from "./components/AlertPanel";
import ErrorLevelChart from "./components/ErrorLevelChart";
import ServiceChart from "./components/ServiceChart";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [alerts, setAlerts] = useState([]);

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

  const fetchAlerts = async () => {

    const response = await fetch(
      "http://127.0.0.1:8000/alerts"
    );

    const data = await response.json();

    setAlerts(data);
  };

  useEffect(() => {

    fetchStats();
    fetchLogs();
    fetchServiceDistribution();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
      fetchServiceDistribution();
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);

  }, []);
  const filteredLogs = logs.filter((log) => {

    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService =
      selectedService === "ALL" ||
      log.service === selectedService;

    const matchesLevel =
      selectedLevel === "ALL" ||
      log.level === selectedLevel;

    return (
      matchesSearch &&
      matchesService &&
      matchesLevel
    );
  });

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
      <AlertPanel alerts={alerts} />
      <div className="charts-container">

        <ServiceChart data={serviceData} />

        <ErrorLevelChart logs={logs} />

      </div>

      <div className="logs-section">
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "20px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >

          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              width: "250px",
              borderRadius: "8px",
              border: "none"
            }}
          />

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px"
            }}
          >
            <option value="ALL">All Services</option>
            <option value="auth-service">auth-service</option>
            <option value="order-service">order-service</option>
            <option value="payment-service">payment-service</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px"
            }}
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

        </div>

        <h2>
          Recent Logs ({filteredLogs.length})
        </h2>

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

            {filteredLogs.length === 0 ? (

              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "20px"
                  }}
                >
                  No logs found
                </td>
              </tr>

            ) : (

              filteredLogs.map((log, index) => (

                <tr key={index}>

                  <td>{log.service}</td>

                  <td>{log.level}</td>

                  <td>{log.message}</td>

                  <td>{log.response_time} ms</td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default App;