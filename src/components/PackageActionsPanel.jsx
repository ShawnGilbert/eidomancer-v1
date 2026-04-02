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
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-blue-200/70">
        Package Actions
      </div>
      <h3 className="mt-2 text-2xl font-semibold text-white">
        Expand the cast
      </h3>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={isGeneratingAsset}
          className="rounded-xl bg-blue-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGeneratingAsset ? "Generating..." : "Generate All"}
        </button>

        {actions.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onGenerate(value)}
            disabled={isGeneratingAsset}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}