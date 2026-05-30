function AIExplanationPanel({ explanation }) {
  return (
    <div
      style={{
        background: "#182544",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "20px",
        color: "white"
      }}
    >
      <h2>🤖 AI Anomaly Explanation</h2>

      <p
        style={{
          lineHeight: "1.8",
          whiteSpace: "pre-wrap"
        }}
      >
        {explanation}
      </p>
    </div>
  );
}

export default AIExplanationPanel;