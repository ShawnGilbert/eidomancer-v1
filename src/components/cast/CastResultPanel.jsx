import { useEidomancer } from "../../state/EidomancerContext";

function StatusBanner() {
  const { state } = useEidomancer();
  const { phase, message, error } = state.status;

  return (
    <div className={`status-banner status-${phase}`}>
      <strong>{message}</strong>
      {error ? <p className="status-error">{error}</p> : null}
    </div>
  );
}

export default function CastResultPanel() {
  const { state } = useEidomancer();
  const cast = state.activeCast;

  return (
    <section className="panel result-panel">
      <StatusBanner />

      {!cast ? (
        <div className="empty-state">
          <h2>No active cast yet</h2>
          <p>Your cast will appear here after the pipeline runs.</p>
        </div>
      ) : (
        <>
          <div className="result-header">
            <p className="eyebrow">Current Cast</p>
            <h2>{cast.title || "Untitled Cast"}</h2>
          </div>

          <div className="result-grid single-column">
            <div className="result-card wide-card">
              <p className="result-label">Question</p>
              <p>{cast.question}</p>
            </div>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <p className="result-label">Pattern</p>
              <p>{cast.pattern}</p>
            </div>
            <div className="result-card">
              <p className="result-label">Tension</p>
              <p>{cast.tension}</p>
            </div>
            <div className="result-card">
              <p className="result-label">Insight</p>
              <p>{cast.insight}</p>
            </div>
            <div className="result-card">
              <p className="result-label">Advice</p>
              <p>{cast.advice}</p>
            </div>
          </div>

          <div className="result-card echo-card">
            <p className="result-label">Echo</p>
            <p>{cast.echo}</p>
          </div>

          <details className="raw-response">
            <summary>Raw response</summary>
            <pre>{JSON.stringify(state.rawResponse, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}