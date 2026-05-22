import { useEffect, useMemo, useState } from "react";
import { getThemePalette } from "../../lib/themePalettes";
import ArtifactCard from "./ArtifactCard";

const depthLayerTypes = [
  ["signal", "Signal"],
  ["tension", "Tension"],
  ["pattern", "Pattern"],
  ["echo", "Echo"],
  ["guidance", "Guidance"],
];

const artifactTheme = getThemePalette("emergent").artifact;
const depthLayerStyles = artifactTheme.depthLayerStyles;
const artifactMoodStyles = artifactTheme.moodStyles;

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

function getSectionByType(record, type) {
  if (!Array.isArray(record?.sections)) return null;

  return record.sections.find((section) => {
    const sectionType = String(section?.type || section?.id || "").toLowerCase();
    const sectionTitle = String(section?.title || "").toLowerCase();

    return sectionType === type || sectionTitle === type;
  });
}

function getSectionText(section) {
  if (!section) return "";

  return (
    section.content ||
    section.full ||
    section.body ||
    section.short ||
    section.description ||
    ""
  );
}

function getDepthLayerText(type, sourceRecord, artifact) {
  if (type === "echo") {
    return (
      sourceRecord?.echo ||
      getSectionText(getSectionByType(sourceRecord, "echo")) ||
      artifact?.echo ||
      getSectionText(getSectionByType(artifact, "echo"))
    );
  }

  if (type === "guidance") {
    const artifactGuidance = Array.isArray(artifact?.sections)
      ? artifact.sections.find((section) => section?.action)?.action
      : "";

    return (
      sourceRecord?.guidance ||
      sourceRecord?.recommendation ||
      sourceRecord?.coreCard?.guidance ||
      getSectionText(getSectionByType(sourceRecord, "guidance")) ||
      artifactGuidance ||
      getSectionText(getSectionByType(artifact, "guidance"))
    );
  }

  return (
    getSectionText(getSectionByType(sourceRecord, type)) ||
    getSectionText(getSectionByType(artifact, type))
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

  const layers = useMemo(
    () =>
      depthLayerTypes
        .map(([type, label]) => ({
          type,
          label,
          text: getDepthLayerText(type, sourceRecord, artifact),
        }))
        .filter((layer) => Boolean(layer.text)),
    [artifact, sourceRecord]
  );

  useEffect(() => {
    setOpenLayers({});
    setCopiedLayer("");
    setCopiedAllLayers(false);
  }, [artifact?.id, artifact?.savedAt, sourceRecord?.id]);

  const hasLayers = layers.length > 0;

  function toggleLayer(type) {
    setOpenLayers((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  async function copyLayer(type, text) {
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedLayer(type);
    window.setTimeout(() => setCopiedLayer(""), 1500);
  }

  async function copyAllLayers() {
    const text = layers
      .map((layer) => `${layer.label.toUpperCase()}\n${layer.text}`)
      .join("\n\n");

    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedAllLayers(true);
    window.setTimeout(() => setCopiedAllLayers(false), 1500);
  }

  return (
    <section className="mt-4 rounded-3xl border border-cyan-300/10 bg-slate-950/90 p-3 shadow-xl shadow-cyan-950/20 sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/70">
            Depth Layers
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Expand the compressed cast.
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Open a layer to unpack this cast into signal, tension, pattern, echo, and guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">
            {layers.length} available
          </div>
          {hasLayers ? (
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

      <div className="mt-4 grid gap-2">
        {!hasLayers ? (
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

          return (
            <div
              key={layer.type}
              className={`rounded-2xl border border-l-2 text-left transition-all duration-200 ease-out ${layerStyle.edge} ${
                isOpen
                  ? "border-cyan-300/45 bg-cyan-400/12 p-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                  : "border-white/10 bg-white/[0.04] p-3 hover:border-cyan-300/25 hover:bg-white/[0.07]"
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
                    className={`h-2 w-2 rounded-full ${layerStyle.marker}`}
                    aria-hidden="true"
                  />
                  <div className={`text-xs font-bold uppercase tracking-[0.24em] ${layerStyle.label}`}>
                    {layer.label}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {isOpen ? "Collapse" : "Expand"}
                </div>
              </button>

              <div
                className={`mt-2 whitespace-pre-wrap text-sm ${
                  isOpen
                    ? "rounded-xl border border-white/10 bg-black/20 p-3 leading-7 text-slate-100"
                    : "line-clamp-2 leading-6 text-slate-300/70"
                }`}
              >
                {isOpen ? layer.text : previewText(layer.text)}
              </div>

              {isOpen ? (
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

export default function ArtifactViewer({
  artifact,
  sourceRecord,
  contextLabel = "Current Daily Cast",
}) {
  const [visible, setVisible] = useState(false);
  const artifactKey = useMemo(
    () => getArtifactTransitionKey(artifact),
    [artifact]
  );
  const artifactMood = useMemo(
    () => inferArtifactMood(artifact, sourceRecord),
    [artifact, sourceRecord]
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

  if (!artifact) return null;

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

      <div className={`${artifactTheme.stageFrameBase} ${moodStyle.stage}`}>
        <div className={artifactTheme.stageInset} />
        <div className={`${artifactTheme.stageRuleBase} ${moodStyle.rule}`} />
        <div className={artifactTheme.moodBadge}>
          Mood: {formatMoodLabel(artifactMood)}
        </div>
        <div className="relative">
          <ArtifactCard artifact={artifact} />
        </div>
      </div>
      <DepthLayers artifact={artifact} sourceRecord={sourceRecord} />
    </div>
  );
}
