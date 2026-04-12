// D:\eidomancer\src\components\daily\DailyFocusInput.jsx

import { useEffect, useState } from "react";

export default function DailyFocusInput({
  initialValue = "",
  onSubmit,
  onClear,
  isLoading = false,
  className = "",
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    onSubmit?.(trimmed);
  }

  function handleClear() {
    if (isLoading) return;

    setValue("");
    onClear?.();
  }

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
        Today’s Focus
      </div>

      <div className="mt-2 text-sm leading-6 text-white/70">
        Give Eidomancer one question, tension, or area of attention for today.
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="What is today really about?"
          rows={4}
          disabled={isLoading}
          className="w-full rounded-2xl border border-white/10 bg-[#0b1622] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/40"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isLoading || !value.trim()
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"
                : "border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
            }`}
          >
            {isLoading ? "Casting..." : "Cast From Focus"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || !value.trim()}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isLoading || !value.trim()
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"
                : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}