import { useEffect, useState } from "react"

function App() {

  const [logs, setLogs] = useState([])
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {

    fetch("http://127.0.0.1:8000/api/logs")
      .then((response) => response.json())
      .then((data) => {

        setLogs(data.logs)

        const errors = data.logs.filter(
          (log) => log.level === "ERROR"
        )

        setErrorCount(errors.length)
      })

  }, [])

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
          <p>{logs.length}</p>
        </div>

        <div style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
          width: "250px"
        }}>
          <h3>Error Logs</h3>
          <p>{errorCount}</p>
        </div>

        <div style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
          width: "250px"
        }}>
          <h3>Anomalies Detected</h3>
          <p>{errorCount}</p>
        </div>

      </div>

      <h2 style={{ marginTop: "40px" }}>
        Recent Logs
      </h2>

      <div style={{
        marginTop: "20px"
      }}>

        {logs.map((log, index) => (

          <div
            key={index}
            style={{
              backgroundColor: "#1e293b",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px"
            }}
          >

            <p><strong>Service:</strong> {log.service}</p>
            <p><strong>Level:</strong> {log.level}</p>
            <p><strong>Message:</strong> {log.message}</p>
            <p><strong>Response Time:</strong> {log.response_time} ms</p>

          </div>

        ))}

      </div>

    </div>
  )
}

export default App