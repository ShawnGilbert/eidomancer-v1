import { useEidomancer } from "../../state/EidomancerContext";

export default function ArchivePanel() {
  const { state } = useEidomancer();
  const archive = state?.archive ?? [];

  return (
    <section className="panel archive-panel">
      <div className="archive-header">
        <h2>Recent Casts</h2>
        <span>{archive.length}</span>
      </div>

      {archive.length === 0 ? (
        <p className="muted-text">No archived casts yet.</p>
      ) : (
        <div className="archive-list">
          {archive.map((cast, index) => (
            <article key={`${cast.question}-${index}`} className="archive-card">
              <p className="archive-title">{cast.title || "Untitled Cast"}</p>
              <p className="archive-question">{cast.question}</p>
              <p className="archive-echo">{cast.echo}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}