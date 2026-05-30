const getAlertColor = (severity) => {
  switch (severity) {
    case "HIGH":
      return "#8B0000"; // Dark Red

    case "MEDIUM":
      return "#b8860b"; // Dark Yellow

    default:
      return "#006400"; // Dark Green
  }
};

function AlertPanel({ alerts }) {

  return (
    <div
      style={{
        background: "#182544",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "20px",
        marginBottom: "20px"
      }}
    >
      <h2>🚨 Active Alerts</h2>

      {alerts.length === 0 ? (

        <p>No active alerts</p>

      ) : (

        alerts.map((alert, index) => (

          <div
            key={index}
            style={{
              padding: "10px",
              marginBottom: "10px",
              background: getAlertColor(alert.severity),
              borderRadius: "8px",
              color: "white",
              fontWeight: "500"
            }}
          >
            <strong>{alert.severity}</strong>

            {" | "}

            {alert.service}

            <br />

            {alert.message}
          </div>

        ))

      )}

    </div>
  );
}

export default AlertPanel;