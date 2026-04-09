import { useEffect, useState } from "react";

export default function AIConnectionPanel() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking the Ruliad...");

  async function checkConnection() {
    try {
      setStatus("checking");
      setMessage("Checking the Ruliad...");

      const res = await fetch("/api/ai/status");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.reason || "Status request failed");
      }

      if (data.connected) {
        setStatus("connected");
        setMessage("Connected to the Ruliad");
      } else {
        setStatus("disconnected");
        setMessage(data.reason || "Not connected");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Connection error");
    }
  }

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider opacity-70">
            AI Connection
          </div>
          <div className="text-sm">{message}</div>
        </div>

        <button
          onClick={checkConnection}
          className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs hover:bg-cyan-500/20"
        >
          Connect
        </button>
      </div>
    </div>
  );
}