import CardFrame from "./CardFrame";
import { TarotSectionCard } from "./TarotSectionCard";

const sectionStyles = {
  header: "bg-purple-500/10 border-purple-400/20 text-purple-200",
  signal: "bg-slate-100/5 border-slate-200/10 text-slate-100",
  tension: "bg-orange-500/10 border-orange-400/20 text-orange-200",
  pattern: "bg-blue-500/10 border-blue-400/20 text-blue-200",
  poem: "bg-indigo-500/10 border-indigo-400/20 text-indigo-200",
  echo: "bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-200",
};

function Badge({ children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </div>
  );
}

function summarizeSourceLabel(question = "") {
  const text = (question || "").trim();

  if (!text) {
    return "Question: —";
  }

  if (text.length > 1200) {
    return "Source: long transcript / pasted text";
  }

  if (text.length > 220) {
    return `Source: ${text.slice(0, 180).trim()}...`;
  }

  return `Question: ${text}`;
}

function getDominantType(activeCast) {
  if (!activeCast) return "signal";

  const entries = [
    ["signal", activeCast.signal],
    ["tension", activeCast.tension],
    ["pattern", activeCast.pattern],
    ["poem", activeCast.poem],
    ["echo", activeCast.echo],
  ];

  let bestType = "signal";
  let bestScore = 0;

  for (const [type, value] of entries) {
    const score = typeof value === "string" ? value.trim().length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  if (bestType === "poem") return "echo";
  return bestType;
}

export function ActiveCastCard({ activeCast, isCasting }) {
  if (isCasting) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm text-blue-100/80">Reading pattern...</div>
        <div className="mt-2 text-sm text-blue-100/60">Finding tension...</div>
        <div className="mt-2 text-sm text-blue-100/50">Shaping poem...</div>
      </section>
    );
  }

  if (!activeCast) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-medium text-blue-100">
          Ask a question to begin.
        </div>
        <div className="mt-2 text-3xl font-semibold text-white">
          No active cast yet
        </div>
        <div className="mt-3 text-sm text-blue-100/75">
          Your cast will appear here after the pipeline runs.
        </div>
      </section>
    );
  }

  const dominantType = getDominantType(activeCast);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 text-xs uppercase tracking-[0.25em] text-blue-200/70">
        Active Cast
      </div>

      <CardFrame dominantType={dominantType}>
        <div className="relative z-10 p-5 md:p-6">
          <div
            className={`rounded-2xl border px-5 py-5 ${sectionStyles.header}`}
          >
            <div className="text-center text-2xl tracking-[0.45em] text-fuchsia-300">
              ✦ ◌ ✦
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge className="border-purple-300/25 bg-purple-400/15 text-purple-200">
                ☽ Receptive
              </Badge>
              <Badge className="border-purple-300/25 bg-purple-400/15 text-purple-200">
                ✧ The Emergent Veil ✧
              </Badge>
            </div>

            <h2 className="mt-4 text-center text-3xl font-semibold text-white md:text-4xl">
              {activeCast.title || "Untitled Cast"}
            </h2>

            <p className="mt-3 text-center text-sm text-blue-100/75">
              {summarizeSourceLabel(activeCast.question)}
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid gap-5 lg:grid-cols-3">
              <TarotSectionCard
                title="Signal"
                body={activeCast.signal}
                sigil="⊚"
                tone="blue"
                orientation="portrait"
              />

              <TarotSectionCard
                title="Tension"
                body={activeCast.tension}
                sigil="🔥"
                tone="ember"
                orientation="portrait"
              />

              <TarotSectionCard
                title="Pattern"
                body={activeCast.pattern}
                sigil="≈"
                tone="violet"
                orientation="portrait"
              />
            </div>

            <TarotSectionCard
              title="Poem"
              body={activeCast.poem}
              sigil="✶"
              tone="violet"
              orientation="landscape"
            />

            <TarotSectionCard
              title="Echo"
              body={activeCast.echo}
              sigil="🜃"
              tone="teal"
              orientation="landscape"
            />
          </div>
        </div>
      </CardFrame>
    </section>
  );
}