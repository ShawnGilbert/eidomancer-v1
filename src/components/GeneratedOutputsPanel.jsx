import { useMemo, useState } from "react";

function stringifyAsset(data) {
  if (!data) return "Not generated yet.";

  if (typeof data === "string") return data;

  if (typeof data !== "object") return String(data);

  if (data.bundle) return data.bundle;
  if (data.lyrics) return data.lyrics;
  if (data.prompt) return data.prompt;
  if (data.description) return data.description;

  return Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.join("\n")}`;
      }

      if (value && typeof value === "object") {
        return `${key}:\n${Object.entries(value)
          .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
          .join("\n")}`;
      }

      return `${key}: ${value}`;
    })
    .join("\n\n");
}

function previewText(text, maxLength = 180) {
  if (!text) return "Not generated yet.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function AssetCard({
  title,
  data,
  isOpen,
  onToggle,
  onCopy,
  copied,
}) {
  const fullText = useMemo(() => stringifyAsset(data), [data]);
  const shortText = useMemo(() => previewText(fullText), [fullText]);
  const hasContent = !!data;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07143a]">
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-100/80">
            {isOpen ? fullText : shortText}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10"
          >
            {isOpen ? "Collapse" : "Expand"}
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasContent}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GeneratedOutputsPanel({ activeCast }) {
  const { assets = {} } = activeCast || {};
  const [copied, setCopied] = useState("");
  const [openSections, setOpenSections] = useState({
    coreCard: false,
    echo: false,
    lyrics: false,
    suno: false,
    youtube: false,
    fullPackage: false,
  });

  function markCopied(key) {
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function handleCopy(key, value) {
    const text = stringifyAsset(value);
    if (!text || text === "Not generated yet.") return;

    navigator.clipboard.writeText(text);
    markCopied(key);
  }

  function handleCopyFullPackage() {
    if (!assets.fullPackage) return;
    handleCopy("fullPackageTop", assets.fullPackage);
  }

  function toggleSection(key) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
          disabled={!assets.fullPackage}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied === "fullPackageTop" ? "Copied Full Package" : "Copy Full Package"}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <AssetCard
          title="Core Card"
          data={assets.coreCard}
          isOpen={openSections.coreCard}
          onToggle={() => toggleSection("coreCard")}
          onCopy={() => handleCopy("coreCard", assets.coreCard)}
          copied={copied === "coreCard"}
        />

        <AssetCard
          title="Echo"
          data={assets.echo}
          isOpen={openSections.echo}
          onToggle={() => toggleSection("echo")}
          onCopy={() => handleCopy("echo", assets.echo)}
          copied={copied === "echo"}
        />

        <AssetCard
          title="Lyrics"
          data={assets.lyrics}
          isOpen={openSections.lyrics}
          onToggle={() => toggleSection("lyrics")}
          onCopy={() => handleCopy("lyrics", assets.lyrics)}
          copied={copied === "lyrics"}
        />

        <AssetCard
          title="Suno"
          data={assets.suno}
          isOpen={openSections.suno}
          onToggle={() => toggleSection("suno")}
          onCopy={() => handleCopy("suno", assets.suno)}
          copied={copied === "suno"}
        />

        <AssetCard
          title="YouTube Package"
          data={assets.youtube}
          isOpen={openSections.youtube}
          onToggle={() => toggleSection("youtube")}
          onCopy={() => handleCopy("youtube", assets.youtube)}
          copied={copied === "youtube"}
        />

        <AssetCard
          title="Full Package"
          data={assets.fullPackage}
          isOpen={openSections.fullPackage}
          onToggle={() => toggleSection("fullPackage")}
          onCopy={() => handleCopy("fullPackage", assets.fullPackage)}
          copied={copied === "fullPackage"}
        />
      </div>
    </section>
  );
}