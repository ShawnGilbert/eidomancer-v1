import { useMemo, useState } from "react";

function stringifyAsset(data) {
  if (!data) return "Not generated yet.";

  if (typeof data === "string") return data;
  if (typeof data !== "object") return String(data);

  if (data.bundle) return data.bundle;
  if (data.lyrics) return data.lyrics;
  if (data.songTitle || data.sunoStylePrompt) {
    return [
      data.songTitle ? `Song Title:\n${data.songTitle}` : "",
      data.sunoStylePrompt ? `Suno Style Prompt:\n${data.sunoStylePrompt}` : "",
      data.lyrics ? `Lyrics:\n${data.lyrics}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  if (data.videoTitle) {
    return [
      `Video Title:\n${data.videoTitle}`,
      data.description ? `Description:\n${data.description}` : "",
      data.tags ? `Tags:\n${data.tags}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  if (data.prompt) return data.prompt;
  if (data.description) return data.description;
  if (data.body) return data.body;

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

function getAssetBadges(data) {
  if (!data || typeof data !== "object") return [];

  if (data.videoTitle) return ["Video", "Description", "Tags"];
  if (data.songTitle || data.sunoStylePrompt) return ["Song", "Style", "Lyrics"];
  if (data.prompt) return ["Prompt"];
  if (data.imageFormat?.key) return [data.imageFormat.key];
  if (data.lyrics) return ["Lyrics"];
  if (data.bundle) return ["Bundle"];

  return [];
}

function buildFullPackageText(assets = {}) {
  const sections = [];

  if (assets.echo?.prompt) {
    sections.push(["ECHO PROMPT", assets.echo.prompt]);
  }

  if (assets.song?.songTitle) {
    sections.push(["SONG TITLE", assets.song.songTitle]);
  }

  if (assets.song?.sunoStylePrompt) {
    sections.push(["SUNO STYLE PROMPT", assets.song.sunoStylePrompt]);
  }

  if (assets.song?.lyrics) {
    sections.push(["LYRICS", assets.song.lyrics]);
  }

  if (assets.youtube?.videoTitle) {
    sections.push(["YOUTUBE TITLE", assets.youtube.videoTitle]);
  }

  if (assets.youtube?.description) {
    sections.push(["YOUTUBE DESCRIPTION", assets.youtube.description]);
  }

  if (assets.youtube?.tags) {
    sections.push(["YOUTUBE TAGS", assets.youtube.tags]);
  }

  return sections
    .map(([label, body]) => `=== ${label} ===\n${body}`)
    .join("\n\n");
}

function slugifyFilename(value = "") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "package";
}

function getPackageFilename(assets = {}) {
  const title =
    assets.song?.songTitle ||
    assets.youtube?.videoTitle ||
    assets.echo?.title ||
    assets.coreCard?.title;

  return `eidomancer-${slugifyFilename(title)}-package.txt`;
}

function buildDerivedAssets(activeCast, generatedOnly = false) {
  const explicitAssets =
    activeCast && typeof activeCast.assets === "object" ? activeCast.assets : {};

  if (generatedOnly) {
    return explicitAssets;
  }

  const coreCard =
    explicitAssets.coreCard ||
    (activeCast?.coreCard
      ? {
          title: activeCast.coreCard.title || activeCast.title || "Core Card",
          subtitle: activeCast.coreCard.subtitle || "",
          hook: activeCast.coreCard.hook || "",
          question: activeCast.question || activeCast.input || "",
        }
      : null);

  const echo =
    explicitAssets.echo ||
    activeCast?.shareables?.echoCard ||
    (activeCast?.echo
      ? {
          title: activeCast.title || "Echo",
          body: activeCast.echo,
          vibe: activeCast?.shareables?.echoCard?.vibe || "neutral",
        }
      : null);

  return {
    ...explicitAssets,
    coreCard,
    echo,
    lyrics: explicitAssets.lyrics || null,
    suno: explicitAssets.suno || null,
    youtube: explicitAssets.youtube || null,
    fullPackage:
      explicitAssets.fullPackage ||
      (coreCard || echo
        ? {
            title: activeCast?.title || "Untitled Cast",
            subtitle: activeCast?.subtitle || "",
            question: activeCast?.question || activeCast?.input || "",
            coreCard,
            echo,
          }
        : null),
  };
}

function AssetCard({ title, data, isOpen, onToggle, onCopy, copied }) {
  const fullText = useMemo(() => stringifyAsset(data), [data]);
  const shortText = useMemo(() => previewText(fullText, 140), [fullText]);
  const badges = useMemo(() => getAssetBadges(data), [data]);
  const hasContent = !!data;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07143a] shadow-lg shadow-black/10">
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-white">{title}</div>
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/75"
                >
                  {badge}
                </span>
              ))}
            </div>

            {!isOpen ? (
              <div className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-blue-100/70">
                {shortText}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              disabled={!hasContent}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10 disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10"
            >
              {isOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {isOpen ? (
          <pre className="mt-4 max-h-[34rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-blue-100/85">
            {fullText}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function GeneratedOutputsPanel({ activeCast, generatedOnly = false }) {
  const assets = useMemo(
    () => buildDerivedAssets(activeCast, generatedOnly),
    [activeCast, generatedOnly]
  );
  const hasGeneratedOutput = Object.values(assets || {}).some(Boolean);
  const [copied, setCopied] = useState("");
  const [openSections, setOpenSections] = useState({
    coreCard: false,
    echo: false,
    song: false,
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
    const text = buildFullPackageText(assets);
    if (!text) return;

    navigator.clipboard.writeText(text);
    markCopied("fullPackageTop");
  }

  function handleExportFullPackage() {
    const text = buildFullPackageText(assets);
    if (!text) return;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getPackageFilename(assets);
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleSection(key) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-white">
          Generated Outputs
        </h3>

        {hasGeneratedOutput ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleCopyFullPackage}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10"
            >
              {copied === "fullPackageTop" ? "Copied" : "Copy Full Package"}
            </button>

            <button
              type="button"
              onClick={handleExportFullPackage}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition hover:bg-white/10"
            >
              Export Full Package
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {hasGeneratedOutput ? null : (
          <div className="rounded-2xl border border-white/10 bg-[#07143a] p-4 text-sm leading-6 text-blue-100/70">
            Create an Echo, Song, YouTube package, or Full Package to expand this cast.
          </div>
        )}

        {assets.echo ? (
          <AssetCard
            title="Echo Prompt"
            data={assets.echo}
            isOpen={openSections.echo}
            onToggle={() => toggleSection("echo")}
            onCopy={() => handleCopy("echo", assets.echo)}
            copied={copied === "echo"}
          />
        ) : null}

        {assets.song ? (
          <AssetCard
            title="Song Package"
            data={assets.song}
            isOpen={openSections.song}
            onToggle={() => toggleSection("song")}
            onCopy={() => handleCopy("song", assets.song)}
            copied={copied === "song"}
          />
        ) : null}

        {assets.coreCard ? (
          <AssetCard
            title="Core Card"
            data={assets.coreCard}
            isOpen={openSections.coreCard}
            onToggle={() => toggleSection("coreCard")}
            onCopy={() => handleCopy("coreCard", assets.coreCard)}
            copied={copied === "coreCard"}
          />
        ) : null}

        {assets.lyrics ? (
          <AssetCard
            title="Lyrics"
            data={assets.lyrics}
            isOpen={openSections.lyrics}
            onToggle={() => toggleSection("lyrics")}
            onCopy={() => handleCopy("lyrics", assets.lyrics)}
            copied={copied === "lyrics"}
          />
        ) : null}

        {assets.suno ? (
          <AssetCard
            title="Suno"
            data={assets.suno}
            isOpen={openSections.suno}
            onToggle={() => toggleSection("suno")}
            onCopy={() => handleCopy("suno", assets.suno)}
            copied={copied === "suno"}
          />
        ) : null}

        {assets.youtube ? (
          <AssetCard
            title="YouTube Package"
            data={assets.youtube}
            isOpen={openSections.youtube}
            onToggle={() => toggleSection("youtube")}
            onCopy={() => handleCopy("youtube", assets.youtube)}
            copied={copied === "youtube"}
          />
        ) : null}

        {assets.fullPackage ? (
          <AssetCard
            title="Full Package"
            data={assets.fullPackage}
            isOpen={openSections.fullPackage}
            onToggle={() => toggleSection("fullPackage")}
            onCopy={() => handleCopy("fullPackage", assets.fullPackage)}
            copied={copied === "fullPackage"}
          />
        ) : null}
      </div>
    </section>
  );
}
