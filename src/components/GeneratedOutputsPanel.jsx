import { useMemo, useState } from "react";
import { normalizePackageOutputs } from "../lib/normalizeArtifact";
import { OUTPUT_KEYS, getOutputLabel } from "../lib/outputRegistry";

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

  if (data.cardTitle && data.coreObject) return ["Core Card", "Image Prompt"];
  if (data.videoTitle) return ["Video", "Description", "Tags"];
  if (data.songTitle || data.sunoStylePrompt) return ["Song", "Style", "Lyrics"];
  if (data.prompt) return ["Prompt"];
  if (data.imageFormat?.key) return [data.imageFormat.key];
  if (data.lyrics) return ["Lyrics"];
  if (data.bundle) return ["Bundle"];

  return [];
}

function getImageMetadata(data) {
  if (!data || typeof data !== "object") return [];

  return [
    data.orientation ? ["Orientation", data.orientation] : null,
    data.recommendedAspectRatio
      ? ["Aspect", data.recommendedAspectRatio]
      : data.imageFormat?.aspectRatio
      ? ["Aspect", data.imageFormat.aspectRatio]
      : null,
    data.intendedUse ? ["Use", data.intendedUse] : null,
    data.suggestedRenderingStyle ? ["Style", data.suggestedRenderingStyle] : null,
  ].filter(Boolean);
}

const outputPresentation = {
  echo: {
    typeLabel: "Echo Artifact",
    accent: "border-l-cyan-300/55",
    badge: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100/75",
  },
  coreImagePrompt: {
    typeLabel: "Core Card Image Prompt",
    accent: "border-l-emerald-300/45",
    badge: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100/75",
  },
  song: {
    typeLabel: "Song Artifact",
    accent: "border-l-fuchsia-300/45",
    badge: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100/75",
  },
  youtube: {
    typeLabel: "Video Artifact",
    accent: "border-l-amber-300/45",
    badge: "border-amber-300/20 bg-amber-400/10 text-amber-100/75",
  },
  default: {
    typeLabel: "Package Artifact",
    accent: "border-l-cyan-300/35",
    badge: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100/75",
  },
};

function buildCardPreview(data, fullText, artifactType) {
  if (artifactType === "echo" && data?.prompt) {
    return previewText(data.prompt, 150);
  }

  if (artifactType === "coreImagePrompt" && data?.prompt) {
    return [
      data.cardTitle ? `Card: ${data.cardTitle}` : "",
      data.coreObject ? `Object: ${previewText(data.coreObject, 90)}` : "",
      previewText(data.prompt, 140),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (artifactType === "song" && data) {
    return [
      data.songTitle ? `Title: ${data.songTitle}` : "",
      data.sunoStylePrompt ? `Style: ${previewText(data.sunoStylePrompt, 120)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (artifactType === "youtube" && data) {
    return [
      data.videoTitle ? `Title: ${data.videoTitle}` : "",
      data.description ? previewText(data.description, 135) : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return previewText(fullText, 140);
}

function buildFullPackageText(assets = {}) {
  const sections = [];

  if (assets.echo?.prompt) {
    sections.push(["ECHO PROMPT", assets.echo.prompt]);
  }

  if (assets.coreImagePrompt?.prompt) {
    sections.push(["CORE CARD IMAGE PROMPT", assets.coreImagePrompt.prompt]);
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
    assets.coreImagePrompt?.cardTitle ||
    assets.coreCard?.title;

  return `eidomancer-${slugifyFilename(title)}-package.txt`;
}

function buildDerivedAssets(activeCast, generatedOnly = false) {
  // Package outputs may be restored from several archive-era field names.
  // Normalize them here so export/copy UI can stay tolerant of partial records.
  const packageOutputs = normalizePackageOutputs(activeCast);
  const explicitAssets =
    activeCast && typeof activeCast.assets === "object" ? activeCast.assets : {};
  const normalizedAssets = {
    ...packageOutputs,
    ...explicitAssets,
  };

  if (generatedOnly) {
    return normalizedAssets;
  }

  const coreCard =
    normalizedAssets.coreCard ||
    (activeCast?.coreCard
      ? {
          title: activeCast.coreCard.title || activeCast.title || "Core Card",
          subtitle: activeCast.coreCard.subtitle || "",
          hook: activeCast.coreCard.hook || "",
          question: activeCast.question || activeCast.input || "",
        }
      : null);

  const echo =
    normalizedAssets.echo ||
    activeCast?.shareables?.echoCard ||
    (activeCast?.echo
      ? {
          title: activeCast.title || "Echo",
          body: activeCast.echo,
          vibe: activeCast?.shareables?.echoCard?.vibe || "neutral",
        }
      : null);

  return {
    ...normalizedAssets,
    coreCard,
    echo,
    coreImagePrompt: normalizedAssets.coreImagePrompt || null,
    lyrics: normalizedAssets.lyrics || null,
    suno: normalizedAssets.suno || null,
    youtube: normalizedAssets.youtube || null,
    fullPackage:
      normalizedAssets.fullPackage ||
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

function AssetCard({
  title,
  data,
  isOpen,
  onToggle,
  onCopy,
  copied,
  artifactType = "default",
}) {
  const fullText = useMemo(() => stringifyAsset(data), [data]);
  const presentation =
    outputPresentation[artifactType] || outputPresentation.default;
  const shortText = useMemo(
    () => buildCardPreview(data, fullText, artifactType),
    [data, fullText, artifactType]
  );
  const badges = useMemo(() => getAssetBadges(data), [data]);
  const imageMetadata = useMemo(() => getImageMetadata(data), [data]);
  const hasContent = !!data;

  return (
    <div
      className={`rounded-2xl border border-l-2 bg-[#07143a]/95 transition-all duration-200 ${
        isOpen
          ? "border-blue-200/25 shadow-xl shadow-blue-950/20"
          : "border-white/10 shadow-md shadow-black/10 hover:border-blue-200/20"
      } ${presentation.accent}`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/55">
              {presentation.typeLabel}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold leading-6 text-white">
                {title}
              </div>
              {badges.map((badge) => (
                <span
                  key={badge}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${presentation.badge}`}
                >
                  {badge}
                </span>
              ))}
            </div>

            {!isOpen ? (
              <div className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-blue-100/62 sm:text-sm sm:leading-6">
                {shortText}
              </div>
            ) : null}

            {imageMetadata.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {imageMetadata.map(([label, value]) => (
                  <span
                    key={`${label}-${value}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100/55"
                  >
                    <span className="text-blue-200/35">{label}</span>{" "}
                    {value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
            <button
              type="button"
              onClick={onCopy}
              disabled={!hasContent}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-blue-50 transition hover:bg-white/10 disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-blue-50 transition hover:bg-white/10"
            >
              <span aria-hidden="true">{isOpen ? "- " : "+ "}</span>
              {isOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {isOpen ? (
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-blue-200/15 bg-black/25 p-3 text-xs leading-6 text-blue-100/85 sm:max-h-[34rem] sm:p-4 sm:text-sm">
            {fullText}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function GeneratedOutputsPanel({
  activeCast,
  generatedOnly = false,
  onClearOutputs,
}) {
  const assets = useMemo(
    () => buildDerivedAssets(activeCast, generatedOnly),
    [activeCast, generatedOnly]
  );
  const hasGeneratedOutput = Object.values(assets || {}).some(Boolean);
  const [copied, setCopied] = useState("");
  const [openSections, setOpenSections] = useState({
    coreCard: false,
    echo: false,
    coreImagePrompt: false,
    song: false,
    lyrics: false,
    suno: false,
    youtube: false,
    fullPackage: false,
  });
  const [copyError, setCopyError] = useState("");

  function markCopied(key) {
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function markCopyFailed() {
    setCopied("");
    setCopyError("Copy failed.");
    setTimeout(() => setCopyError(""), 2000);
  }

  async function handleCopy(key, value) {
    const text = stringifyAsset(value);
    if (!text || text === "Not generated yet.") return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyError("");
      markCopied(key);
    } catch {
      markCopyFailed();
    }
  }

  async function handleCopyFullPackage() {
    const text = buildFullPackageText(assets);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyError("");
      markCopied("fullPackageTop");
    } catch {
      markCopyFailed();
    }
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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white sm:text-xl">
            Generated Outputs
          </h3>
          <p className="mt-1 text-sm leading-6 text-blue-100/55">
            Copy or export outputs to reuse outside Eidomancer.
          </p>
        </div>

        {hasGeneratedOutput ? (
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={handleCopyFullPackage}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-blue-50 transition hover:bg-white/10"
            >
              {copied === "fullPackageTop" ? "Copied" : "Copy Full Package"}
            </button>

            <button
              type="button"
              onClick={handleExportFullPackage}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-blue-50 transition hover:bg-white/10"
            >
              Export Full Package
            </button>

            {onClearOutputs ? (
              <button
                type="button"
                onClick={onClearOutputs}
                className="rounded-xl border border-red-300/20 bg-red-400/10 px-3.5 py-2 text-xs font-medium text-red-100/80 transition hover:bg-red-400/15"
              >
                Clear Outputs
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {copyError ? (
        <div className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-100/80">
          {copyError}
        </div>
      ) : null}

      <div className="mt-5 space-y-3.5 sm:space-y-4">
        {hasGeneratedOutput ? null : (
          <div className="rounded-2xl border border-cyan-300/10 bg-[#07143a] p-3 sm:p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/55">
              No Outputs Yet
            </div>
            <p className="mt-2 text-sm leading-6 text-blue-100/70">
              Create Echo, Song, YouTube, or Full Package outputs from this cast.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                getOutputLabel(OUTPUT_KEYS.ECHO),
                getOutputLabel(OUTPUT_KEYS.SONG),
                getOutputLabel(OUTPUT_KEYS.YOUTUBE),
                getOutputLabel(OUTPUT_KEYS.FULL_PACKAGE),
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/65"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {assets.echo ? (
          <AssetCard
            title={getOutputLabel(OUTPUT_KEYS.ECHO)}
            artifactType="echo"
            data={assets.echo}
            isOpen={openSections.echo}
            onToggle={() => toggleSection("echo")}
            onCopy={() => handleCopy("echo", assets.echo)}
            copied={copied === "echo"}
          />
        ) : null}

        {assets.coreImagePrompt ? (
          <AssetCard
            title={getOutputLabel(OUTPUT_KEYS.CORE_IMAGE_PROMPT)}
            artifactType="coreImagePrompt"
            data={assets.coreImagePrompt}
            isOpen={openSections.coreImagePrompt}
            onToggle={() => toggleSection("coreImagePrompt")}
            onCopy={() => handleCopy("coreImagePrompt", assets.coreImagePrompt)}
            copied={copied === "coreImagePrompt"}
          />
        ) : null}

        {assets.song ? (
          <AssetCard
            title={getOutputLabel(OUTPUT_KEYS.SONG)}
            artifactType="song"
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
            title={getOutputLabel(OUTPUT_KEYS.YOUTUBE)}
            artifactType="youtube"
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
