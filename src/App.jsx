import { useEffect, useMemo, useState } from "react";

// ========================================
// CONFIG / CONSTANTS
// ========================================
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api/cast";

const STORAGE_KEYS = {
  history: "eidomancer_history_v3",
};

const SUGGESTED_QUESTIONS = [
  "What pattern am I standing inside right now?",
  "What am I refusing to admit to myself?",
  "What should I focus on over the next 7 days?",
  "What is draining my momentum?",
  "What wants to emerge if I stop resisting it?",
];

const HISTORY_LIMIT = 12;

// ========================================
// PARSING / TEXT PROCESSING
// ========================================
const MAIN_SECTION_LABELS = [
  "CARD TITLE",
  "VERDICT",
  "SNAPSHOT",
  "FIELD READING",
  "TENSION",
  "ACTION",
  "ECHO",
];

const ECHO_SECTION_LABELS = ["TITLE", "SUMMARY", "ADVICE"];

function normalizeNewlines(text = "") {
  return text.replace(/\r\n/g, "\n").trim();
}

function cleanLine(text = "") {
  return text.replace(/^[#*\-\s]+/, "").trim();
}

function getSectionValue(text, label, allLabels) {
  const normalized = normalizeNewlines(text);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const otherLabels = allLabels.filter((item) => item !== label);

  const nextPattern =
    otherLabels.length > 0
      ? otherLabels
          .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")
      : null;

  const regex = new RegExp(
    nextPattern
      ? `(?:^|\\n)${escapedLabel}\\s*:\\s*([\\s\\S]*?)(?=\\n(?:${nextPattern})\\s*:|$)`
      : `(?:^|\\n)${escapedLabel}\\s*:\\s*([\\s\\S]*)$`,
    "i"
  );

  const match = normalized.match(regex);
  return match ? match[1].trim() : "";
}

function parseEcho(text = "") {
  const normalized = normalizeNewlines(text);
  const echoBlock = getSectionValue(normalized, "ECHO", MAIN_SECTION_LABELS);

  if (!echoBlock) return null;

  const title =
    getSectionValue(echoBlock, "TITLE", ECHO_SECTION_LABELS) ||
    cleanLine(echoBlock.split("\n")[0] || "");

  const summary = getSectionValue(echoBlock, "SUMMARY", ECHO_SECTION_LABELS);
  const advice = getSectionValue(echoBlock, "ADVICE", ECHO_SECTION_LABELS);

  if (!title && !summary && !advice) return null;

  return {
    title: title || "The Echo",
    summary,
    advice,
  };
}

function parseCast(text = "") {
  const normalized = normalizeNewlines(text);

  const title =
    getSectionValue(normalized, "CARD TITLE", MAIN_SECTION_LABELS) ||
    "Untitled Cast";

  const verdict = getSectionValue(normalized, "VERDICT", MAIN_SECTION_LABELS);
  const snapshot = getSectionValue(normalized, "SNAPSHOT", MAIN_SECTION_LABELS);
  const fieldReading = getSectionValue(
    normalized,
    "FIELD READING",
    MAIN_SECTION_LABELS
  );
  const tension = getSectionValue(normalized, "TENSION", MAIN_SECTION_LABELS);
  const action = getSectionValue(normalized, "ACTION", MAIN_SECTION_LABELS);
  const echo = parseEcho(normalized);

  return {
    raw: normalized,
    title,
    verdict,
    snapshot,
    fieldReading,
    tension,
    action,
    echo,
  };
}

// ========================================
// HELPERS
// ========================================
function safeLoadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load history:", err);
    return [];
  }
}

function safeSaveHistory(nextHistory) {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(nextHistory));
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

function buildShareText(question, result) {
  const parts = [
    `Eidomancer Cast: ${result?.title || "Untitled Cast"}`,
    question ? `Question: ${question}` : "",
    result?.verdict ? `Verdict: ${result.verdict}` : "",
    result?.snapshot ? `Snapshot: ${result.snapshot}` : "",
    result?.fieldReading ? `Field Reading: ${result.fieldReading}` : "",
    result?.tension ? `Tension: ${result.tension}` : "",
    result?.action ? `Action: ${result.action}` : "",
    result?.echo?.title ? `Echo: ${result.echo.title}` : "",
    result?.echo?.summary ? result.echo.summary : "",
    result?.echo?.advice ? `Advice: ${result.echo.advice}` : "",
  ];

  return parts.filter(Boolean).join("\n\n");
}

// ========================================
// UI COMPONENTS
// ========================================
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
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function PromptChip({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      style={{
        padding: "10px 12px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "#fff",
        cursor: "pointer",
        fontSize: "0.88rem",
        lineHeight: 1.2,
      }}
    >
      {text}
    </button>
  );
}

// ========================================
// MAIN APP COMPONENT
// ========================================
export default function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHistory(safeLoadHistory());
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const canCast = useMemo(
    () => question.trim().length > 0 && !loading,
    [question, loading]
  );

  const saveHistory = (nextHistory) => {
    setHistory(nextHistory);
    safeSaveHistory(nextHistory);
  };

  const resetCurrentCast = () => {
    setResult(null);
    setError("");
    setStatusMessage("");
  };

  const clearInputAndResult = () => {
    setQuestion("");
    resetCurrentCast();
  };

  const generateCast = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question first.");
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("Casting through the field...");

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

      let data = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to generate cast (${res.status}).`
        );
      }

      const text = data?.text || "No cast returned.";
      const cast = parseCast(text);

      setResult(cast);
      setStatusMessage("Cast received.");

      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        question: trimmedQuestion,
        title: cast.title,
        verdict: cast.verdict,
        snapshot: cast.snapshot,
        fieldReading: cast.fieldReading,
        tension: cast.tension,
        action: cast.action,
        echo: cast.echo,
        raw: cast.raw,
      };

      const nextHistory = [newEntry, ...history].slice(0, HISTORY_LIMIT);
      saveHistory(nextHistory);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while casting.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setQuestion(item.question || "");
    setResult({
      title: item.title || "Untitled Cast",
      verdict: item.verdict || "",
      snapshot: item.snapshot || "",
      fieldReading: item.fieldReading || "",
      tension: item.tension || "",
      action: item.action || "",
      echo: item.echo || null,
      raw: item.raw || "",
    });
    setError("");
    setStatusMessage("Loaded from recent casts.");
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.history);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
    setHistory([]);
    setStatusMessage("Recent casts cleared.");
  };

  const handleCopyCast = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(buildShareText(question, result));
      setCopied(true);
      setStatusMessage("Cast copied to clipboard.");
    } catch (err) {
      console.error("Copy failed:", err);
      setError("Could not copy the cast.");
    }
  };

  const handleQuestionKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (canCast) generateCast();
    }
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
            <div
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                opacity: 0.65,
                marginBottom: "4px",
              }}
            >
              The Emergent Ones
            </div>

            <div
              style={{
                fontSize: "1.2rem",
                opacity: 0.4,
                marginBottom: "10px",
              }}
            >
              ◈
            </div>

            <h1 style={{ margin: 0, fontSize: "2rem" }}>Eidomancer</h1>

            <p style={{ marginTop: "8px", opacity: 0.85, lineHeight: 1.6 }}>
              Ask a real question. Receive a symbolic cast. A modern, adaptive
              system for navigating uncertainty through pattern, tension, and
              insight.
            </p>

            <p
              style={{
                marginTop: "6px",
                opacity: 0.65,
                fontSize: "0.92rem",
                lineHeight: 1.5,
              }}
            >
              Not Tarot—but a fluid, evolving reflection system that adapts as
              reality shifts.
            </p>

            <p
              style={{
                marginTop: "10px",
                opacity: 0.6,
                fontSize: "0.88rem",
                lineHeight: 1.5,
              }}
            >
              The question shapes the field. The cast reveals the pattern. The
              Echo speaks what remains.
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
            onKeyDown={handleQuestionKeyDown}
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

          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "0.82rem",
                opacity: 0.68,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Suggested prompts
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {SUGGESTED_QUESTIONS.map((item) => (
                <PromptChip key={item} text={item} onClick={setQuestion} />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "18px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              onClick={generateCast}
              disabled={!canCast}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "none",
                cursor: canCast ? "pointer" : "not-allowed",
                background: canCast ? "#7c3aed" : "#6b7280",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.98rem",
              }}
            >
              {loading ? "Casting..." : "Cast"}
            </button>

            <button
              onClick={clearInputAndResult}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.14)",
                cursor: loading ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              Clear
            </button>

            {result && (
              <button
                onClick={handleCopyCast}
                disabled={loading}
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {copied ? "Copied" : "Copy Cast"}
              </button>
            )}

            <div style={{ fontSize: "0.88rem", opacity: 0.72 }}>
              Press Ctrl/Cmd + Enter to cast
            </div>
          </div>

          {statusMessage && !error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(96,165,250,0.24)",
                color: "#dbeafe",
              }}
            >
              {statusMessage}
            </div>
          )}

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

                {result.verdict && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(124,58,237,0.12)",
                      border: "1px solid rgba(167,139,250,0.25)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.74rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        opacity: 0.72,
                        marginBottom: "6px",
                        fontWeight: 700,
                      }}
                    >
                      Verdict
                    </div>

                    <div
                      style={{
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        fontWeight: 600,
                      }}
                    >
                      {result.verdict}
                    </div>
                  </div>
                )}
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

                  {item.verdict && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        opacity: 0.82,
                        lineHeight: 1.45,
                        marginBottom: "6px",
                      }}
                    >
                      {item.verdict}
                    </div>
                  )}

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

      <style>{`
        @media (max-width: 900px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}