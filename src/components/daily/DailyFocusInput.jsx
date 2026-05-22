// D:\eidomancer\src\components\daily\DailyFocusInput.jsx

import { useEffect, useState } from "react";

export default function DailyFocusInput({
  initialValue = "",
  resetKey = 0,
  appliedFocus = "",
  onSubmit,
  onClear,
  isLoading = false,
  hasActiveCast = true,
  className = "",
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setValue("");
    setIsEditing(false);
  }, [resetKey]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    onSubmit?.(trimmed);
  }

  function handleClear() {
    if (isLoading) return;

    setValue("");
    setIsEditing(false);
    onClear?.();
  }

  const hasTypedFocus = Boolean(value.trim());
  const hasAppliedFocus = Boolean(String(appliedFocus || "").trim());
  const isCompact = hasAppliedFocus && !hasTypedFocus && !isEditing;
  const textareaRows = isCompact ? 2 : 4;

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
        Generate Daily Cast
      </div>

      <div className="mt-2 text-sm leading-6 text-white/72">
        Offer one question, tension, or area of attention. Keep it simple and real.
      </div>

      {!hasActiveCast ? (
        <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-50/80">
          Enter a question, tension, or focus to generate your first daily symbolic cast.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setIsEditing(true);
          }}
          onFocus={() => setIsEditing(true)}
          placeholder={
            hasAppliedFocus
              ? "Ask a new focus, or leave today's lens in place."
              : "What is pressing on you today?"
          }
          rows={textareaRows}
          disabled={isLoading}
          className="w-full rounded-2xl border border-white/10 bg-[#0b1622] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/40 focus:bg-[#0d1927]"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading || !hasTypedFocus}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isLoading
                ? "cursor-wait border border-cyan-300/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)] animate-pulse"
                : !hasTypedFocus
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"
                : "border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
            }`}
          >
            {isLoading ? "Casting..." : "Generate Cast"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || (!hasTypedFocus && !hasAppliedFocus)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isLoading || (!hasTypedFocus && !hasAppliedFocus)
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"
                : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            Clear Focus
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-50/80">
            <span className="font-medium text-cyan-100">Reading the signal...</span>{" "}
            Drawing the card and shaping the daily cast.
          </div>
        ) : null}
      </form>

      <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/65">
          Current Lens
        </div>

        <div className="mt-1 max-h-12 overflow-hidden text-sm leading-6 text-white/85">
          {hasAppliedFocus
            ? appliedFocus
            : "No explicit focus is shaping the current cast."}
        </div>
      </div>
    </div>
  );
}
