import { useState } from "react";
import { OutputSection } from "./OutputSection";

export function GeneratedOutputsPanel({ activeCast }) {
  const { assets } = activeCast;
  const [copied, setCopied] = useState(false);

  function handleCopyFullPackage() {
    if (!assets.fullPackage?.bundle) return;

    navigator.clipboard.writeText(assets.fullPackage.bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-blue-200/70">
            Generated Outputs
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Cast-derived assets
          </h3>
        </div>

        <button
          type="button"
          onClick={handleCopyFullPackage}
          disabled={!assets.fullPackage?.bundle}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? "Copied Full Package" : "Copy Full Package"}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <OutputSection title="Core Card" data={assets.coreCard} />
        <OutputSection title="Echo" data={assets.echo} />
        <OutputSection title="Lyrics" data={assets.lyrics} />
        <OutputSection title="Suno" data={assets.suno} />
        <OutputSection title="YouTube Package" data={assets.youtube} />
        <OutputSection title="Full Package" data={assets.fullPackage} />
      </div>
    </section>
  );
}