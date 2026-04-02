const sectionStyles = {
  archetype: "bg-purple-500/10 border-purple-400/20 text-purple-200",
  oracle: "bg-slate-100/5 border-slate-200/10 text-slate-100",
  threshold: "bg-indigo-500/10 border-indigo-400/20 text-indigo-200",
  omen: "bg-violet-500/10 border-violet-400/20 text-violet-200",
  pattern: "bg-blue-500/10 border-blue-400/20 text-blue-200",
  tension: "bg-orange-500/10 border-orange-400/20 text-orange-200",
  insight: "bg-cyan-500/10 border-cyan-400/20 text-cyan-200",
  advice: "bg-emerald-500/10 border-emerald-400/20 text-emerald-200",
  invitation: "bg-amber-500/10 border-amber-400/20 text-amber-200",
  echo: "bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-200",
};

function SectionCard({ title, body, type, sigil }) {
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

function InsightBlock({ title, body, type, sigil }) {
  return (
    <div className={`rounded-2xl border p-4 ${sectionStyles[type]}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
        <span className="text-sm">{sigil}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/90">{body}</p>
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

export function ActiveCastCard({ activeCast, isCasting }) {
  if (isCasting) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm text-blue-100/80">Reading pattern...</div>
        <div className="mt-2 text-sm text-blue-100/60">Finding tension...</div>
        <div className="mt-2 text-sm text-blue-100/50">Shaping insight...</div>
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

  const { cast, input } = activeCast;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-blue-200/70">
        Active Cast
      </div>

      <div className={`mt-4 rounded-2xl border px-5 py-5 ${sectionStyles.archetype}`}>
        <div className="text-center text-2xl tracking-[0.45em] text-fuchsia-300">
          {cast.sigil || "✦ ◌ ✦"}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge className="border-purple-300/25 bg-purple-400/15 text-purple-200">
            {cast.sigils?.archetype || "◈"} Archetype
          </Badge>
          <Badge className="border-purple-300/25 bg-purple-400/15 text-purple-200">
            {cast.archetype || "The Signal Beneath the Noise"}
          </Badge>
        </div>

        <h2 className="mt-4 text-center text-3xl font-semibold text-white">
          {cast.title}
        </h2>

        <p className="mt-3 text-center text-sm text-blue-100/75">
          Question: {input.question}
        </p>
      </div>

      <SectionCard
        title="Oracle"
        body={`“${cast.oracle || cast.echo}”`}
        type="oracle"
        sigil={cast.sigils?.oracle || "✧"}
      />

      <SectionCard
        title="Threshold"
        body={cast.threshold}
        type="threshold"
        sigil={cast.sigils?.threshold || "◬"}
      />

      <SectionCard
        title="Reading"
        body={cast.reading}
        type="archetype"
        sigil={cast.sigils?.archetype || "◈"}
      />

      <SectionCard
        title="Omen"
        body={cast.omen}
        type="omen"
        sigil={cast.sigils?.omen || "⟁"}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InsightBlock
          title="What is happening"
          body={cast.pattern}
          type="pattern"
          sigil={cast.sigils?.pattern || "≈"}
        />
        <InsightBlock
          title="Where you are split"
          body={cast.tension}
          type="tension"
          sigil={cast.sigils?.tension || "🔥"}
        />
        <InsightBlock
          title="What becomes clear"
          body={cast.insight}
          type="insight"
          sigil={cast.sigils?.insight || "✺"}
        />
        <InsightBlock
          title="What to do next"
          body={cast.advice}
          type="advice"
          sigil={cast.sigils?.advice || "⬢"}
        />
      </div>

      <SectionCard
        title="Invitation"
        body={cast.invitation}
        type="invitation"
        sigil={cast.sigils?.invitation || "☉"}
      />

      <SectionCard
        title="Echo"
        body={cast.echo}
        type="echo"
        sigil={cast.sigils?.echo || "◎"}
      />
    </section>
  );
}