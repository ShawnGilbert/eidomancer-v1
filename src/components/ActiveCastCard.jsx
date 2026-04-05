import { TarotSectionCard } from "./TarotSectionCard";
import CastSection from "./CastSection";
const sectionStyles = {
  header: "bg-purple-500/10 border-purple-400/20 text-purple-200",
  signal: "bg-slate-100/5 border-slate-200/10 text-slate-100",
  tension: "bg-orange-500/10 border-orange-400/20 text-orange-200",
  pattern: "bg-blue-500/10 border-blue-400/20 text-blue-200",
  poem: "bg-indigo-500/10 border-indigo-400/20 text-indigo-200",
  echo: "bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-200",
};

function SectionCard({ title, body, type, sigil }) {
  if (!body) return null;

  return (
    <div className={`rounded-2xl border px-4 py-4 ${sectionStyles[type]}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
        <span className="text-sm">{sigil}</span>
        {title}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/90">
        {body}
      </div>
    </div>
  );
}

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

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-blue-200/70">
        Active Cast
      </div>

      <div className={`mt-4 rounded-2xl border px-5 py-5 ${sectionStyles.header}`}>
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

        <h2 className="mt-4 text-center text-3xl font-semibold text-white">
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
    </section>
  );
}