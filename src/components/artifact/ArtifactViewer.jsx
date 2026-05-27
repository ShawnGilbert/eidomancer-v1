import { useEffect, useMemo, useState } from "react";
import {
  getCoreDerivedAuras,
  getDepthLayerTypes,
} from "../../lib/artifactPresentation";
import { DEFAULT_THEME_ID, getThemePalette } from "../../lib/themePalettes";
import {
  getArtifactSectionText,
  getNormalizedArtifactSections,
  normalizeArtifact,
} from "../../lib/normalizeArtifact";
import {
  getArtifactSourceCast,
  loadSavedArtifacts,
} from "../../lib/artifactStorage";
import ArtifactCard from "./ArtifactCard";

const depthLayerTypes = getDepthLayerTypes();
const RESONANCE_TYPES = [
  ["signal", "Signal"],
  ["tension", "Tension"],
  ["pattern", "Pattern"],
  ["coreObject", "Core Object"],
];
const RESONANCE_THRESHOLD = 2;
const GENERIC_MEMORY_LABELS = new Set([
  "signal",
  "tension",
  "pattern",
  "insight",
  "guidance",
  "recommendation",
  "echo",
  "essence",
  "core object",
  "section",
]);

// TODO: Route future user-selected theme IDs here without persisting theme state yet.
const artifactTheme = getThemePalette(DEFAULT_THEME_ID).artifact;
const depthLayerStyles = artifactTheme.depthLayerStyles;
const artifactMoodStyles = artifactTheme.moodStyles;
const coreDerivedAuras = getCoreDerivedAuras();

function cleanText(value = "") {
  return String(value || "").trim();
}

function getMemoryKey(value = "") {
  return cleanText(value).toLowerCase();
}

function hashText(value = "") {
  return Array.from(cleanText(value)).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    7
  );
}

function isUsefulMemoryLabel(value = "") {
  const label = cleanText(value);

  return Boolean(label) && !GENERIC_MEMORY_LABELS.has(label.toLowerCase());
}

function getArtifactTransitionKey(artifact) {
  return [
    artifact?.id,
    artifact?.savedAt,
    artifact?.updatedAt,
    artifact?.title,
  ]
    .filter(Boolean)
    .join("::");
}

function getSectionMemoryLabel(record = {}, type) {
  const explicit = cleanText(record?.memoryLabels?.[type]);

  if (isUsefulMemoryLabel(explicit)) return explicit;

  const sections = getNormalizedArtifactSections(record);
  const section = sections.find((item) => {
    const sectionType = cleanText(item.type || item.id).toLowerCase();
    const sectionTitle = cleanText(item.title).toLowerCase();

    return sectionType === type || sectionTitle === type;
  });

  if (!section) return "";

  if (isUsefulMemoryLabel(section.memoryLabel)) return section.memoryLabel;
  if (isUsefulMemoryLabel(section.title)) return section.title;

  return "";
}

function getCoreObjectMemoryLabel(record = {}) {
  const explicit = cleanText(record?.memoryLabels?.coreObject);

  if (isUsefulMemoryLabel(explicit)) return explicit;

  return cleanText(
    record?.coreCard?.name ||
      record?.coreCard?.title ||
      record?.title ||
      record?.coreObject
  );
}

function getRecordMemoryLabel(record = {}, type) {
  return type === "coreObject"
    ? getCoreObjectMemoryLabel(record)
    : getSectionMemoryLabel(record, type);
}

function addResonanceCount(map, type, label) {
  if (!isUsefulMemoryLabel(label)) return;

  const key = getMemoryKey(label);
  const current = map[type].get(key);

  map[type].set(key, {
    label: current?.label || label,
    count: (current?.count || 0) + 1,
  });
}

function buildSavedResonanceMap() {
  const resonanceMap = {
    signal: new Map(),
    tension: new Map(),
    pattern: new Map(),
    coreObject: new Map(),
  };

  loadSavedArtifacts().forEach((savedArtifact) => {
    const normalizedArtifact = normalizeArtifact(savedArtifact);
    const normalizedSource = normalizeArtifact(
      getArtifactSourceCast(savedArtifact) || {}
    );

    RESONANCE_TYPES.forEach(([type]) => {
      addResonanceCount(
        resonanceMap,
        type,
        getRecordMemoryLabel(normalizedArtifact, type) ||
          getRecordMemoryLabel(normalizedSource, type)
      );
    });
  });

  return resonanceMap;
}

function getArtifactResonance(artifact, sourceRecord) {
  const resonanceMap = buildSavedResonanceMap();

  return RESONANCE_TYPES.map(([type, label]) => {
    const currentLabel =
      getRecordMemoryLabel(artifact, type) ||
      getRecordMemoryLabel(sourceRecord, type);
    const savedMatch = resonanceMap[type].get(getMemoryKey(currentLabel));

    if (!currentLabel || !savedMatch || savedMatch.count < RESONANCE_THRESHOLD) {
      return null;
    }

    return {
      type,
      label,
      memoryLabel: savedMatch.label,
      count: savedMatch.count,
    };
  }).filter(Boolean);
}

function collectMoodText(artifact, sourceRecord) {
  const sourceSections = Array.isArray(sourceRecord?.sections)
    ? sourceRecord.sections
    : [];
  const artifactSections = Array.isArray(artifact?.sections)
    ? artifact.sections
    : [];

  return [
    artifact?.title,
    artifact?.subtitle,
    artifact?.coreObject,
    sourceRecord?.title,
    sourceRecord?.subtitle,
    sourceRecord?.tone,
    sourceRecord?.mood,
    sourceRecord?.echo,
    sourceRecord?.coreCard?.title,
    sourceRecord?.coreCard?.description,
    sourceRecord?.coreCard?.imageGeneration?.mood,
    sourceRecord?.coreCard?.visual?.atmosphere,
    ...sourceSections.map((section) =>
      [section?.title, section?.content, section?.full, section?.short].join(" ")
    ),
    ...artifactSections.map((section) =>
      [section?.title, section?.full, section?.short, section?.action].join(" ")
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferArtifactMood(artifact, sourceRecord) {
  const text = collectMoodText(artifact, sourceRecord);

  const moodSignals = [
    ["ominous", ["shadow", "omen", "haunt", "threat", "void", "dark", "danger"]],
    ["tense", ["tension", "friction", "pressure", "crack", "urgent", "conflict"]],
    ["hopeful", ["hope", "open", "bloom", "renew", "bright", "possibility"]],
    ["reflective", ["reflect", "memory", "mirror", "listen", "observe", "still"]],
    ["calm", ["calm", "steady", "ground", "quiet", "soft", "balance"]],
  ];

  const matched = moodSignals.find(([, words]) =>
    words.some((word) => text.includes(word))
  );

  return matched?.[0] || "calm";
}

function formatMoodLabel(mood) {
  if (!mood) return "Calm";

  return `${mood.charAt(0).toUpperCase()}${mood.slice(1)}`;
}

function getCoreCardDerivedSeed(artifact, sourceRecord) {
  const artifactSections = getNormalizedArtifactSections(artifact);
  const sourceSections = getNormalizedArtifactSections(sourceRecord);
  const dominantSections = [...sourceSections, ...artifactSections]
    .map((section) =>
      [
        section?.type,
        section?.title,
        section?.memoryLabel,
        previewText(section?.full || section?.content || section?.short, 48),
      ]
        .filter(Boolean)
        .join(":")
    )
    .filter(Boolean)
    .slice(0, 7)
    .join("|");

  return [
    sourceRecord?.coreCard?.name,
    sourceRecord?.coreCard?.title,
    sourceRecord?.coreCard?.visual?.subject,
    sourceRecord?.coreCard?.visual?.primaryMotif,
    sourceRecord?.coreCard?.description,
    artifact?.title,
    artifact?.coreObject,
    artifact?.essence,
    dominantSections,
  ]
    .filter(Boolean)
    .join(" :: ");
}

function deriveCoreCardPresentation(artifact, sourceRecord) {
  const seed = getCoreCardDerivedSeed(artifact, sourceRecord);
  const themeColor = cleanText(
    sourceRecord?.coreCard?.themeColor || artifact?.coreCard?.themeColor
  ).toLowerCase();
  const aura =
    coreDerivedAuras.find((item) => item.key === themeColor) ||
    coreDerivedAuras[hashText(seed) % coreDerivedAuras.length];

  return {
    ...aura,
    background: `radial-gradient(circle at 50% 18%, ${aura.primary} 0%, transparent 36%), radial-gradient(circle at 50% 78%, ${aura.secondary} 0%, transparent 58%)`,
    haloShadow: `0 0 70px ${aura.halo}, inset 0 0 38px rgba(255, 255, 255, 0.03)`,
  };
}

function getDepthLayerText(type, sourceRecord, artifact) {
  if (type === "echo") {
    return (
      sourceRecord?.echo ||
      getArtifactSectionText(sourceRecord, "echo") ||
      artifact?.echo ||
      getArtifactSectionText(artifact, "echo")
    );
  }

  if (type === "guidance") {
    const artifactGuidance =
      getNormalizedArtifactSections(artifact).find((section) => section?.action)
        ?.action || "";

    return (
      sourceRecord?.guidance ||
      sourceRecord?.recommendation ||
      sourceRecord?.advice ||
      sourceRecord?.action ||
      sourceRecord?.coreCard?.guidance ||
      sourceRecord?.coreCard?.recommendation ||
      sourceRecord?.coreCard?.advice ||
      getArtifactSectionText(sourceRecord, "guidance") ||
      getArtifactSectionText(sourceRecord, "recommendation") ||
      getArtifactSectionText(sourceRecord, "advice") ||
      getArtifactSectionText(sourceRecord, "action") ||
      artifactGuidance ||
      artifact?.guidance ||
      artifact?.recommendation ||
      artifact?.advice ||
      artifact?.action ||
      getArtifactSectionText(artifact, "guidance") ||
      getArtifactSectionText(artifact, "recommendation") ||
      getArtifactSectionText(artifact, "advice") ||
      getArtifactSectionText(artifact, "action")
    );
  }

  if (type === "essence") {
    return (
      getArtifactSectionText(sourceRecord, "essence") ||
      sourceRecord?.essence ||
      sourceRecord?.coreObject ||
      sourceRecord?.coreCard?.description ||
      sourceRecord?.echo ||
      getArtifactSectionText(artifact, "essence") ||
      artifact?.essence ||
      artifact?.coreObject ||
      artifact?.subtitle
    );
  }

  return (
    getArtifactSectionText(sourceRecord, type) ||
    getArtifactSectionText(artifact, type)
  );
}

function previewText(value, maxLength = 120) {
  if (!value) return "";
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength).trim()}...`;
}

function DepthLayers({ artifact, sourceRecord }) {
  const [openLayers, setOpenLayers] = useState({});
  const [copiedLayer, setCopiedLayer] = useState("");
  const [copiedAllLayers, setCopiedAllLayers] = useState(false);
  const [copyError, setCopyError] = useState("");

  const layers = useMemo(
    () =>
      depthLayerTypes.map(([type, label]) => {
        const text = getDepthLayerText(type, sourceRecord, artifact);

        return {
          type,
          label,
          text,
          hasContent: Boolean(String(text || "").trim()),
        };
      }),
    [artifact, sourceRecord]
  );

  useEffect(() => {
    setOpenLayers({});
    setCopiedLayer("");
    setCopiedAllLayers(false);
    setCopyError("");
  }, [artifact?.id, artifact?.savedAt, sourceRecord?.id]);

  const availableLayers = layers.filter((layer) => layer.hasContent);
  const hasAvailableLayers = availableLayers.length > 0;

  function toggleLayer(type) {
    setOpenLayers((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  async function copyLayer(type, text) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyError("");
      setCopiedLayer(type);
      window.setTimeout(() => setCopiedLayer(""), 1500);
    } catch {
      setCopiedLayer("");
      setCopyError("Copy failed.");
      window.setTimeout(() => setCopyError(""), 2000);
    }
  }

  async function copyAllLayers() {
    const text = availableLayers
      .map((layer) => `${layer.label.toUpperCase()}\n${layer.text}`)
      .join("\n\n");

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyError("");
      setCopiedAllLayers(true);
      window.setTimeout(() => setCopiedAllLayers(false), 1500);
    } catch {
      setCopiedAllLayers(false);
      setCopyError("Copy failed.");
      window.setTimeout(() => setCopyError(""), 2000);
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-slate-950/90 p-3 shadow-xl shadow-cyan-950/20 sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/70">
            Depth Layers
          </div>
          <h3 className="mt-1 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
            Expand the compressed cast.
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Open a layer to inspect signal, tension, pattern, insight, essence, echo, and guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">
            {availableLayers.length} available
          </div>
          {hasAvailableLayers ? (
            <button
              type="button"
              onClick={copyAllLayers}
              className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/75 transition hover:bg-cyan-400/18"
            >
              {copiedAllLayers ? "Copied" : "Copy All Layers"}
            </button>
          ) : null}
        </div>
      </div>

      {copyError ? (
        <div className="mt-3 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100/80">
          {copyError}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2.5">
        {!hasAvailableLayers ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/65">
              Cast Context Needed
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300/80">
              Depth layers appear when this artifact includes cast context.
            </p>
          </div>
        ) : null}

        {layers.map((layer) => {
          const isOpen = Boolean(openLayers[layer.type]);
          const layerStyle = depthLayerStyles[layer.type] || depthLayerStyles.signal;
          const presenceLabel = layer.hasContent
            ? `${layer.label} content available`
            : `${layer.label} content not available`;

          return (
            <div
              key={layer.type}
              className={`rounded-2xl border border-l-2 text-left transition-all duration-200 ease-out ${layerStyle.edge} ${
                isOpen
                  ? `${layerStyle.open || "border-cyan-300/45 bg-cyan-400/12"} p-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]`
                  : `border-white/10 bg-white/[0.04] p-3 shadow-sm shadow-black/10 ${layer.hasContent ? layerStyle.hover || "hover:border-cyan-300/25" : "hover:border-white/15"} hover:bg-white/[0.07]`
              }`}
            >
              <button
                type="button"
                onClick={() => toggleLayer(layer.type)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      layer.hasContent
                        ? layerStyle.marker
                        : "border border-white/25 bg-transparent"
                    }`}
                    title={presenceLabel}
                    aria-label={presenceLabel}
                  />
                  <div className={`break-words text-xs font-bold uppercase tracking-[0.24em] [overflow-wrap:anywhere] ${
                    layer.hasContent ? layerStyle.label : "text-slate-500"
                  }`}>
                    {layer.label}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  <span aria-hidden="true">{isOpen ? "-" : "+"}</span>
                  <span>{isOpen ? "Collapse" : "Expand"}</span>
                </div>
              </button>

              {!isOpen && layer.hasContent ? (
                <div className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300/70 [overflow-wrap:anywhere]">
                  {previewText(layer.text)}
                </div>
              ) : null}

              {isOpen && layer.hasContent ? (
                <div className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-3.5 text-sm leading-7 text-slate-100 [overflow-wrap:anywhere]">
                  {layer.text}
                </div>
              ) : null}

              {!layer.hasContent ? (
                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">
                  No layer text available yet.
                </div>
              ) : null}

              {isOpen && layer.hasContent ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => copyLayer(layer.type, layer.text)}
                    className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/80 transition hover:bg-cyan-400/18"
                  >
                    {copiedLayer === layer.type ? "Copied" : "Copy Layer"}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ResonancePanel({ matches }) {
  if (!matches.length) return null;

  return (
    <section className="mt-5 rounded-3xl border border-emerald-300/10 bg-emerald-400/[0.04] p-3 shadow-lg shadow-emerald-950/10 sm:p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/70">
        Resonance
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-400">
        This artifact echoes patterns already present in the archive.
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Compared against prior saved artifacts.
      </p>

      <div className="mt-3 grid gap-2.5">
        {matches.map((match) => (
          <div
            key={`${match.type}-${match.memoryLabel}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-3"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/65">
              {match.label}
            </div>
            <div className="mt-1 break-words text-sm font-semibold leading-6 text-slate-100 [overflow-wrap:anywhere]">
              {match.memoryLabel}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Previously seen {match.count} times
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ArtifactViewer({
  artifact,
  sourceRecord,
  contextLabel = "Current Daily Cast",
}) {
  const [visible, setVisible] = useState(false);
  const normalizedArtifact = useMemo(
    () => (artifact ? normalizeArtifact(artifact) : null),
    [artifact]
  );
  const normalizedSourceRecord = useMemo(
    () => (sourceRecord ? normalizeArtifact(sourceRecord) : null),
    [sourceRecord]
  );
  const artifactKey = useMemo(
    () => getArtifactTransitionKey(normalizedArtifact),
    [normalizedArtifact]
  );
  const artifactMood = useMemo(
    () => inferArtifactMood(normalizedArtifact, normalizedSourceRecord),
    [normalizedArtifact, normalizedSourceRecord]
  );
  const resonanceMatches = useMemo(
    () =>
      normalizedArtifact
        ? getArtifactResonance(normalizedArtifact, normalizedSourceRecord)
        : [],
    [normalizedArtifact, normalizedSourceRecord]
  );
  const corePresentation = useMemo(
    () =>
      normalizedArtifact
        ? deriveCoreCardPresentation(normalizedArtifact, normalizedSourceRecord)
        : null,
    [normalizedArtifact, normalizedSourceRecord]
  );
  const moodStyle = artifactMoodStyles[artifactMood] || artifactMoodStyles.calm;

  useEffect(() => {
    if (!artifact) return undefined;

    setVisible(false);

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [artifactKey, artifact]);

  if (!normalizedArtifact) return null;

  return (
    <div
      className={`min-w-0 transform transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.99] opacity-0"
      }`}
    >
      <div className="mb-2 flex justify-end">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          {contextLabel}
        </div>
      </div>

      <div
        className={`${artifactTheme.stageFrameBase} ${moodStyle.stage} ${corePresentation.frame} overflow-hidden`}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-80"
          style={{ background: corePresentation.background }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-7 h-44 w-44 -translate-x-1/2 rounded-full border border-white/10 opacity-70 sm:h-60 sm:w-60"
          style={{ boxShadow: corePresentation.haloShadow }}
        />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-8 h-[72%] w-[58%] -translate-x-1/2 rounded-[2rem] border border-white/10 opacity-55" />
        <div className={artifactTheme.stageInset} />
        <div className={`${artifactTheme.stageRuleBase} ${moodStyle.rule}`} />
        <div className={artifactTheme.moodBadge}>
          Mood: {formatMoodLabel(artifactMood)}
        </div>
        <div className="relative z-[1]">
          <ArtifactCard artifact={normalizedArtifact} />
        </div>
      </div>
      <DepthLayers
        artifact={normalizedArtifact}
        sourceRecord={normalizedSourceRecord}
      />
      <ResonancePanel matches={resonanceMatches} />
    </div>
  );
}
