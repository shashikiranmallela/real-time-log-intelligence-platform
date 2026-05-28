import "./App.css";

function App() {
  return (
    <div className="dashboard">
      <h1>Real-Time Log Intelligence Platform</h1>

      <div className="cards">
        <div className="card">
          <h2>Total Logs</h2>
          <p>1250</p>
        </div>

        <div className="card">
          <h2>Error Logs</h2>
          <p>312</p>
        </div>

        <div className="card">
          <h2>Anomalies Detected</h2>
          <p>48</p>
        </div>
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
            <tr>
              <td>auth-service</td>
              <td>ERROR</td>
              <td>Database connection failed</td>
              <td>4888 ms</td>
            </tr>

            <tr>
              <td>payment-service</td>
              <td>WARN</td>
              <td>High response time detected</td>
              <td>3921 ms</td>
            </tr>

            <tr>
              <td>order-service</td>
              <td>INFO</td>
              <td>Order placed successfully</td>
              <td>412 ms</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;