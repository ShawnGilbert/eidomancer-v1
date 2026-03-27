import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API_BASE = (import.meta.env.VITE_API_URL || "").trim();
const API_ENDPOINT = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/cast` : "/api/cast";

const STORAGE_KEY = "eidomancer_history_v1";
const HISTORY_LIMIT = 12;

const SUGGESTED_QUESTIONS = [
  "What pattern am I standing inside right now?",
  "What am I refusing to admit to myself?",
  "What should I focus on over the next 7 days?",
  "What is draining my momentum?",
  "What wants to emerge if I stop resisting it?",
];

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function normalizeResponse(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Untitled Cast",
    pattern: typeof data.pattern === "string" ? data.pattern.trim() : "",
    tension: typeof data.tension === "string" ? data.tension.trim() : "",
    insight: typeof data.insight === "string" ? data.insight.trim() : "",
    advice: typeof data.advice === "string" ? data.advice.trim() : "",
    echo: typeof data.echo === "string" ? data.echo.trim() : "",
    raw:
      typeof data.raw === "string"
        ? data.raw
        : JSON.stringify(
            {
              title: data.title ?? "",
              pattern: data.pattern ?? "",
              tension: data.tension ?? "",
              insight: data.insight ?? "",
              advice: data.advice ?? "",
              echo: data.echo ?? "",
            },
            null,
            2
          ),
  };
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const canCast = useMemo(() => question.trim().length > 3 && !loading, [question, loading]);

  async function handleCast() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");
    setShowRaw(false);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const rawText = await response.text();

      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error("Server returned invalid JSON.");
      }

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}.`);
      }

      const normalized = normalizeResponse(data);

      const entry = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        question: trimmed,
        createdAt: new Date().toISOString(),
        ...normalized,
      };

      setResult(entry);
      setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
      setStatusMessage("Cast received.");
    } catch (error) {
      setErrorMessage(error?.message || "Failed to fetch cast.");
    } finally {
      setLoading(false);
    }
  }

  function handlePromptClick(text) {
    setQuestion(text);
    setErrorMessage("");
    setStatusMessage("");
  }

  function handleClearQuestion() {
    setQuestion("");
    setStatusMessage("");
    setErrorMessage("");
  }

  function handleCopyCast() {
    if (!result) return;

    const text = [
      result.title,
      "",
      `Question: ${result.question}`,
      "",
      `Pattern: ${result.pattern}`,
      "",
      `Tension: ${result.tension}`,
      "",
      `Insight: ${result.insight}`,
      "",
      `Advice: ${result.advice}`,
      "",
      `Echo: ${result.echo}`,
    ].join("\n");

    navigator.clipboard
      .writeText(text)
      .then(() => setStatusMessage("Cast copied."))
      .catch(() => setStatusMessage("Could not copy cast."));
  }

  function handleLoadHistory(item) {
    setResult(item);
    setQuestion(item.question || "");
    setStatusMessage("");
    setErrorMessage("");
    setShowRaw(false);
  }

  function handleClearHistory() {
    setHistory([]);
    setStatusMessage("History cleared.");
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleCast();
    }
  }

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-a" />
      <div className="page-glow page-glow-b" />

      <main className="main-grid">
        <section className="card cast-panel">
          <div className="eyebrow">THE EMERGENT ONES</div>
          <div className="hero-mark">◈</div>
          <h1>Eidomancer</h1>

          <p className="lead">
            Ask a real question. Receive a symbolic cast. A modern, adaptive system for navigating
            uncertainty through pattern, tension, and insight.
          </p>

          <p className="sublead">
            Not Tarot—but a fluid, evolving reflection system that adapts as reality shifts.
          </p>
          <p className="sublead">
            The question shapes the field. The cast reveals the pattern. The Echo speaks what remains.
          </p>

          <label className="label" htmlFor="cast-question">
            Your question
          </label>

          <textarea
            id="cast-question"
            className="question-box"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What pattern am I standing inside right now?"
            rows={5}
          />

          <div className="label prompt-label">SUGGESTED PROMPTS</div>
          <div className="suggestions">
            {SUGGESTED_QUESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className="suggestion-chip"
                onClick={() => handlePromptClick(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={handleCast} disabled={!canCast}>
              {loading ? "Casting..." : "Cast"}
            </button>

            <button type="button" className="secondary-button" onClick={handleClearQuestion} disabled={loading}>
              Clear
            </button>

            <button type="button" className="secondary-button" onClick={handleCopyCast} disabled={!result}>
              Copy Cast
            </button>

            <span className="shortcut-hint">Press Ctrl/Cmd + Enter to cast</span>
          </div>

          <div className="future-action-row">
            <button type="button" className="future-button" disabled>
              Regenerate
            </button>
            <button type="button" className="future-button" disabled>
              Deepen
            </button>
            <button type="button" className="future-button" disabled>
              Save
            </button>
            <button type="button" className="future-button" disabled>
              Export
            </button>
            <button type="button" className="future-button" disabled>
              Card View
            </button>
          </div>

          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
          {!errorMessage && statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

          <section className="current-cast-shell">
            <div className="eyebrow">CURRENT CAST</div>

            <div className="cast-tab-row">
              <button type="button" className="cast-tab active">
                Interpretation
              </button>
              <button type="button" className="cast-tab" disabled>
                Raw
              </button>
              <button type="button" className="cast-tab" disabled>
                Card
              </button>
              <button type="button" className="cast-tab" disabled>
                Notes
              </button>
            </div>

            <h2>{result?.title || "Untitled Cast"}</h2>

            {!result ? (
              <div className="empty-result">
                <p>Cast a question to fill this area with Pattern, Tension, Insight, Advice, and Echo.</p>
              </div>
            ) : (
              <div className="result-stack">
                <div className="result-block">
                  <div className="result-label">Question</div>
                  <p>{result.question}</p>
                </div>

                <div className="result-grid">
                  <article className="result-block">
                    <div className="result-label">Pattern</div>
                    <p>{result.pattern}</p>
                  </article>

                  <article className="result-block">
                    <div className="result-label">Tension</div>
                    <p>{result.tension}</p>
                  </article>

                  <article className="result-block">
                    <div className="result-label">Insight</div>
                    <p>{result.insight}</p>
                  </article>

                  <article className="result-block">
                    <div className="result-label">Advice</div>
                    <p>{result.advice}</p>
                  </article>
                </div>

                <article className="result-block echo-block">
                  <div className="result-label">Echo</div>
                  <p>{result.echo}</p>
                </article>

                <div className="raw-toggle-row">
                  <button
                    type="button"
                    className="raw-toggle"
                    onClick={() => setShowRaw((prev) => !prev)}
                  >
                    {showRaw ? "▾ Raw response" : "▸ Raw response"}
                  </button>
                </div>

                {showRaw ? <pre className="raw-response">{result.raw}</pre> : null}
              </div>
            )}
          </section>
        </section>

        <aside className="card history-panel">
          <div className="history-header">
            <h3>Recent Casts</h3>
            <button type="button" className="text-button" onClick={handleClearHistory}>
              Clear
            </button>
          </div>

          {history.length === 0 ? (
            <p className="empty-state">Your recent casts will appear here.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="history-item"
                  onClick={() => handleLoadHistory(item)}
                >
                  <div className="history-time">{formatTimestamp(item.createdAt)}</div>
                  <div className="history-title">{item.title || "Untitled Cast"}</div>
                  <div className="history-preview">{item.pattern || item.echo || item.question}</div>
                  <div className="history-question">{item.question}</div>
                </button>
              ))}
            </div>
          )}

          <div className="sidebar-placeholder">
            <div className="sidebar-placeholder-title">Saved Decks</div>
            <div className="sidebar-placeholder-body">Coming soon</div>
          </div>

          <div className="sidebar-placeholder">
            <div className="sidebar-placeholder-title">Filters</div>
            <div className="sidebar-placeholder-body">Coming soon</div>
          </div>
        </aside>
      </main>
    </div>
  );
}