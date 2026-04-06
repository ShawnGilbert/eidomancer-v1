import { PromptChips } from "./PromptChips";

export function QuestionPanel({
  question,
  setQuestion,
  prompts,
  onCast,
  onClear,
  isCasting,
}) {
  const canCast = question.trim().length > 0 && !isCasting;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
      <div className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">
        The Emergent Ones
      </div>

      <h1 className="text-4xl font-semibold tracking-tight text-white">
        Eidomancer
      </h1>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-blue-100/85">
        Ask a real question. Receive a symbolic cast. A modern, adaptive system
        for navigating uncertainty through pattern, tension, and insight.
      </p>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-blue-100/90">
        Not Tarot—but a fluid, evolving reflection system that adapts as reality
        shifts.
      </p>

      <label
        htmlFor="eidomancer-question"
        className="mt-8 block text-sm font-medium text-blue-100"
      >
        Your question
      </label>

      <textarea
        id="eidomancer-question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What pattern am I standing inside right now?"
        className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-white/15 bg-[#081538] px-4 py-3 text-white placeholder:text-blue-200/45 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-blue-200/55">
        <span>Speak plainly. Ask what matters.</span>
        <span>{question.trim().length} chars</span>
      </div>

      <div className="mt-5">
        <PromptChips prompts={prompts} onSelect={setQuestion} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCast}
          disabled={!canCast}
          className="rounded-xl bg-cyan-500/80 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCasting ? "Casting..." : "Cast"}
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={isCasting && !question}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </section>
  );
}