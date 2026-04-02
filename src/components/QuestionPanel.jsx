import { PromptChips } from "./PromptChips";

export function QuestionPanel({ question, setQuestion, prompts, onCast, onClear, isCasting }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
      <div className="mb-2 text-xs uppercase tracking-[0.3em] text-blue-200/70">The Emergent Ones</div>
      <h1 className="text-4xl font-semibold">Eidomancer</h1>
      <p className="mt-6 max-w-3xl text-sm text-blue-100/85">
        Ask a real question. Receive a symbolic cast. A modern, adaptive system for navigating uncertainty through pattern, tension, and insight.
      </p>
      <p className="mt-6 text-base text-blue-100/90">
        Not Tarot—but a fluid, evolving reflection system that adapts as reality shifts.
      </p>

      <label htmlFor="eidomancer-question" className="mt-8 block text-sm font-medium text-blue-100">
        Your question
      </label>

      <textarea
        id="eidomancer-question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What pattern am I standing inside right now?"
        className="mt-3 min-h-[140px] w-full rounded-2xl border border-white/15 bg-[#081538] px-4 py-3 text-white placeholder:text-blue-200/45 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      />

      <div className="mt-4">
        <PromptChips prompts={prompts} onSelect={setQuestion} />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCast}
          disabled={isCasting}
          className="rounded-xl bg-blue-500/80 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCasting ? "Casting..." : "Cast"}
        </button>

        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-blue-50 transition hover:bg-white/10"
        >
          Clear
        </button>
      </div>
    </section>
  );
}