function App() {

  return (
    <div style={{
      backgroundColor: "#0f172a",
      minHeight: "100vh",
      color: "white",
      padding: "20px",
      fontFamily: "Arial"
    }}>

      <h1>Real-Time Log Intelligence Platform</h1>

      <hr />

      <h2>System Dashboard</h2>

      <div style={{
        display: "flex",
        gap: "20px",
        marginTop: "20px",
        flexWrap: "wrap"
      }}>

        <div style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
          width: "250px"
        }}>
          <h3>Total Logs</h3>
          <p>Loading...</p>
        </div>

        <div style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
          width: "250px"
        }}>
          <h3>Error Logs</h3>
          <p>Loading...</p>
        </div>

        <div style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
          width: "250px"
        }}>
          <h3>Anomalies Detected</h3>
          <p>Loading...</p>
        </div>

      </div>

    </div>
  )
}

export default App