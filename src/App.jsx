import { useEffect, useState } from "react";

const API_URL = "https://eidomancer-api.onrender.com/api/cast";

const STORAGE_KEYS = {
  history: "eidomancer_history_v1",
};

function extractSection(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `${escaped}\\s*:?\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Za-z ]+\\s*:|$)`,
    "i"
  );
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function cleanLine(text = "") {
  return text.replace(/^[#*\-\s]+/, "").trim();
}

function parseEcho(text) {
  const echoBlockMatch = text.match(
    /Echo\s*:?\s*([\s\S]*?)(?=\n[A-Z][A-Za-z ]+\s*:|$)/i
  );

  if (!echoBlockMatch) return null;

  const block = echoBlockMatch[1].trim();

  const title =
    extractSection(block, "Title") ||
    extractSection(block, "Echo Title") ||
    cleanLine(block.split("\n")[0] || "");

  const summary =
    extractSection(block, "Summary") ||
    extractSection(block, "Meaning") ||
    cleanLine(block.split("\n").slice(1, 2).join(" ").trim());

  const advice =
    extractSection(block, "Advice") ||
    extractSection(block, "Action") ||
    cleanLine(block.split("\n").slice(2).join(" ").trim());

  if (!title && !summary && !advice) return null;

  return {
    title: title || "The Echo",
    summary: summary || "",
    advice: advice || "",
  };
}

function parseCast(text = "") {
  const title =
    extractSection(text, "Card Title") ||
    extractSection(text, "Title") ||
    cleanLine(text.split("\n")[0] || "") ||
    "Untitled Cast";

  const snapshot =
    extractSection(text, "Snapshot") ||
    extractSection(text, "Overview") ||
    extractSection(text, "Signal") ||
    "";

  const fieldReading =
    extractSection(text, "Field Reading") ||
    extractSection(text, "Field") ||
    "";

  const tension =
    extractSection(text, "Tension") ||
    extractSection(text, "Friction") ||
    "";

  const action =
    extractSection(text, "Action") ||
    extractSection(text, "Next Action") ||
    extractSection(text, "Recommendation") ||
    "";

  const echo = parseEcho(text);

  return {
    raw: text,
    title,
    snapshot,
    fieldReading,
    tension,
    action,
    echo,
  };
}

function Section({ label, text }) {
  if (!text) return null;

  return (
    <div
      style={{
        marginTop: "18px",
        padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "1rem",
          opacity: 0.9,
        }}
      >
        {label}
      </h3>
      <p
        style={{
          margin: 0,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.history);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  const saveHistory = (next) => {
    setHistory(next);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
  };

  const generateCast = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate cast.");
      }

      const text = data?.text || "No cast returned.";
      const cast = parseCast(text);

      setResult(cast);

      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        question: trimmedQuestion,
        title: cast.title,
        snapshot: cast.snapshot,
        fieldReading: cast.fieldReading,
        tension: cast.tension,
        action: cast.action,
        echo: cast.echo,
        raw: cast.raw,
      };

      const nextHistory = [newEntry, ...history].slice(0, 12);
      saveHistory(nextHistory);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while casting.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setQuestion(item.question || "");
    setResult({
      title: item.title || "Untitled Cast",
      snapshot: item.snapshot || "",
      fieldReading: item.fieldReading || "",
      tension: item.tension || "",
      action: item.action || "",
      echo: item.echo || null,
      raw: item.raw || "",
    });
    setError("");
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEYS.history);
    setHistory([]);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1c2340 0%, #0c0f1a 45%, #05070d 100%)",
        color: "#f5f7ff",
        padding: "32px 20px 60px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: "24px",
        }}
      >
        <section
          style={{
            padding: "24px",
            borderRadius: "22px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ marginBottom: "18px" }}>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>Eidomancer</h1>
            <p style={{ marginTop: "8px", opacity: 0.8, lineHeight: 1.6 }}>
              Ask your question. Receive the cast. Hear the Echo.
            </p>
          </div>

          <label
            htmlFor="question"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            Your question
          </label>

          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What pattern am I standing inside right now?"
            rows={5}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              resize: "vertical",
              fontSize: "1rem",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={generateCast}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#6b7280" : "#7c3aed",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.98rem",
              }}
            >
              {loading ? "Casting..." : "Cast"}
            </button>

            <button
              onClick={() => {
                setQuestion("");
                setResult(null);
                setError("");
              }}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.14)",
                cursor: "pointer",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(220,38,38,0.18)",
                border: "1px solid rgba(248,113,113,0.35)",
              }}
            >
              {error}
            </div>
          )}

          {result && (
            <div
              style={{
                marginTop: "28px",
                padding: "22px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: 0.65,
                    marginBottom: "6px",
                  }}
                >
                  Current Cast
                </div>
                <h2 style={{ margin: 0, fontSize: "1.7rem" }}>
                  {result.title}
                </h2>
              </div>

              <Section label="Snapshot" text={result.snapshot} />
              <Section label="Field Reading" text={result.fieldReading} />
              <Section label="Tension" text={result.tension} />
              <Section label="Action" text={result.action} />

              {result?.echo && (
                <div
                  style={{
                    marginTop: "22px",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.12))",
                    border: "1px solid rgba(167,139,250,0.28)",
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0" }}>
                    Echo: {result.echo.title}
                  </h3>

                  {result.echo.summary && (
                    <p style={{ margin: "0 0 10px 0", lineHeight: 1.6 }}>
                      {result.echo.summary}
                    </p>
                  )}

                  {result.echo.advice && (
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      <strong>Advice:</strong> {result.echo.advice}
                    </p>
                  )}
                </div>
              )}

              {result.raw && (
                <details style={{ marginTop: "18px", opacity: 0.85 }}>
                  <summary style={{ cursor: "pointer" }}>Raw response</summary>
                  <pre
                    style={{
                      marginTop: "12px",
                      whiteSpace: "pre-wrap",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      background: "rgba(0,0,0,0.25)",
                      padding: "14px",
                      borderRadius: "12px",
                      overflowX: "auto",
                    }}
                  >
                    {result.raw}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>

        <aside
          style={{
            padding: "20px",
            borderRadius: "22px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "fit-content",
            boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Recent Casts</h2>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "transparent",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>
              Your recent casts will appear here.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.65,
                      marginBottom: "6px",
                    }}
                  >
                    {item.timestamp}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: "6px",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title || "Untitled Cast"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      opacity: 0.82,
                      lineHeight: 1.45,
                    }}
                  >
                    {item.question}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}