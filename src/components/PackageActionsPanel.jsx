const actions = [
  ["coreCard", "Generate Core Card"],
  ["echo", "Generate Echo"],
  ["lyrics", "Generate Lyrics"],
  ["suno", "Generate Suno Prompt"],
  ["youtube", "Generate YouTube Package"],
  ["fullPackage", "Generate Full Package"],
];

export function PackageActionsPanel({
  onGenerate,
  onGenerateAll,
  isGeneratingAsset,
  availableActions = actions,
  statusMessage = "",
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-blue-200/70">
        Output Tools
      </div>
      <h3 className="mt-2 text-2xl font-semibold text-white">
        Create package outputs
      </h3>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {onGenerateAll && (
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAsset}
            className="rounded-xl bg-blue-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingAsset ? "Generating..." : "Generate All"}
          </button>
        )}

        {availableActions.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onGenerate(value)}
            disabled={isGeneratingAsset}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {label}
          </button>
        ))}
      </div>

      {statusMessage ? (
        <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100/80">
          {statusMessage}
        </div>
      ) : null}
    </section>
  );
}
