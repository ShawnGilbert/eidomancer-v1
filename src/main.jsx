import React from "react";
import ReactDOM from "react-dom/client";

function SmokeTest() {
  return (
    <div style={{ padding: "40px", color: "white", fontFamily: "Arial, sans-serif" }}>
      <h1>Smoke test works</h1>
      <p>If you can see this, Vite + React + index.html are fine.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SmokeTest />
  </React.StrictMode>
);