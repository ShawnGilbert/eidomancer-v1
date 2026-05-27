// D:\EidomancerProject\eidomancer-app\src\components\artifact\SavedArtifactsPanel.jsx

import { useReducer } from "react";
import {
  deleteSavedArtifact,
  getArtifactFingerprint,
  getArtifactInput,
  getArtifactPackageOutputs,
  getArtifactSourceCast,
  loadSavedArtifacts,
} from "../../lib/artifactStorage";

const MAX_SAVED_ARTIFACTS_DISPLAY = 5;
const MEMORY_REPEAT_THRESHOLD = 2;
const MEMORY_MAX_ITEMS = 3;

const MEMORY_SECTIONS = [
  ["signal", "Recurring Signals"],
  ["tension", "Recurring Tensions"],
  ["pattern", "Recurring Patterns"],
];

const GENERIC_SECTION_TITLES = {
  signal: "signal",
  tension: "tension",
  pattern: "pattern",
  insight: "insight",
  guidance: "guidance",
  recommendation: "recommendation",
  echo: "echo",
  essence: "essence",
};

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

function cleanText(value = "") {
  return String(value || "").trim();
}

function compactMemoryLabel(value = "", maxLength = 52) {
  const cleaned = cleanText(value).replace(/\s+/g, " ");
  const base = cleaned.replace(/[.!?:;,\-–—]+$/g, "");

  if (!base) return "";
  if (cleaned.endsWith("...") && cleaned.length <= maxLength + 3) return cleaned;
  if (base.length <= maxLength) return base;

  return `${base.slice(0, maxLength).trim().replace(/[.!?:;,\-–—]+$/g, "")}...`;
}

function getSectionType(section = {}) {
  return cleanText(section.type || section.id || section.title).toLowerCase();
}

function getSectionContent(section = {}) {
  return cleanText(
    section.short ||
      section.content ||
      section.full ||
      section.body ||
      section.description
  );
}

function getMemorySectionLabel(record = {}, type) {
  const explicitMemoryLabel = cleanText(record?.memoryLabels?.[type]);

  if (
    explicitMemoryLabel &&
    !GENERIC_MEMORY_LABELS.has(explicitMemoryLabel.toLowerCase())
  ) {
    return compactMemoryLabel(explicitMemoryLabel);
  }

  const sections = Array.isArray(record?.sections) ? record.sections : [];
  const section = sections.find((item) => {
    const sectionType = getSectionType(item);

    return sectionType === type || cleanText(item?.title).toLowerCase() === type;
  });

  if (!section) return "";

  const sectionMemoryLabel = cleanText(section.memoryLabel);

  if (
    sectionMemoryLabel &&
    !GENERIC_MEMORY_LABELS.has(sectionMemoryLabel.toLowerCase())
  ) {
    return compactMemoryLabel(sectionMemoryLabel);
  }

  const title = cleanText(section.title || section.label || section.name);
  const genericTitle = GENERIC_SECTION_TITLES[type];

  if (title && title.toLowerCase() !== genericTitle) {
    return compactMemoryLabel(title);
  }

  return compactMemoryLabel(getSectionContent(section));
}

function getCoreObjectLabel(artifact = {}, sourceCast = {}) {
  const explicitMemoryLabel = cleanText(
    artifact?.memoryLabels?.coreObject || sourceCast?.memoryLabels?.coreObject
  );

  if (
    explicitMemoryLabel &&
    !GENERIC_MEMORY_LABELS.has(explicitMemoryLabel.toLowerCase())
  ) {
    return compactMemoryLabel(explicitMemoryLabel);
  }

  return compactMemoryLabel(
    sourceCast?.coreCard?.name ||
      sourceCast?.coreCard?.title ||
      sourceCast?.coreCard?.description ||
      artifact?.coreObject ||
      artifact?.title
  );
}

function addMemoryCount(counts, value) {
  const label = cleanText(value);
  if (!label) return;

  const key = label.toLowerCase();
  const current = counts.get(key);

  counts.set(key, {
    label: current?.label || label,
    count: (current?.count || 0) + 1,
  });
}

function getTopRecurringItems(counts) {
  return Array.from(counts.values())
    .filter((item) => item.count >= MEMORY_REPEAT_THRESHOLD)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, MEMORY_MAX_ITEMS);
}

function buildArtifactMemory(savedArtifacts = []) {
  const memoryCounts = {
    signal: new Map(),
    tension: new Map(),
    pattern: new Map(),
    coreObject: new Map(),
  };

  savedArtifacts.forEach((artifact) => {
    const sourceCast = getArtifactSourceCast(artifact);

    MEMORY_SECTIONS.forEach(([type]) => {
      addMemoryCount(
        memoryCounts[type],
        getMemorySectionLabel(artifact, type) ||
          getMemorySectionLabel(sourceCast, type)
      );
    });

    addMemoryCount(memoryCounts.coreObject, getCoreObjectLabel(artifact, sourceCast));
  });

  return {
    sections: MEMORY_SECTIONS.map(([type, title]) => ({
      type,
      title,
      items: getTopRecurringItems(memoryCounts[type]),
    })),
    coreObjects: getTopRecurringItems(memoryCounts.coreObject),
  };
}

function formatSavedTimestamp(savedAt) {
  if (!savedAt) return "";

  const savedDate = new Date(savedAt);

  if (Number.isNaN(savedDate.getTime())) return "";

  return savedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isRecentlyViewed(viewedAt) {
  if (!viewedAt) return false;

  const viewedTime = new Date(viewedAt).getTime();

  if (Number.isNaN(viewedTime)) return false;

  return Date.now() - viewedTime < 5 * 60 * 1000;
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

function MemoryList({ title, items }) {
  if (!items.length) return null;

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/65">
        {title}
      </div>
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className="flex items-start gap-2 text-xs leading-5 text-slate-300/85"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/55" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
              {item.label}{" "}
              <span className="text-slate-500">({item.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SavedArtifactsPanel({
  activeArtifact,
  onSelectArtifact,
}) {
  const [, forceRefresh] = useReducer((value) => value + 1, 0);

  function deleteArtifact(index) {
    deleteSavedArtifact(index);
    forceRefresh();
  }

  const savedArtifacts = loadSavedArtifacts();
  const visibleArtifacts = savedArtifacts.slice(0, MAX_SAVED_ARTIFACTS_DISPLAY);
  const artifactMemory = buildArtifactMemory(savedArtifacts);
  const hasArtifactMemory =
    artifactMemory.coreObjects.length > 0 ||
    artifactMemory.sections.some((section) => section.items.length > 0);
  const fullCastCount = savedArtifacts.filter((artifact) =>
    Boolean(getArtifactSourceCast(artifact))
  ).length;
  const packageOutputCount = savedArtifacts.filter((artifact) => {
    const outputs = getArtifactPackageOutputs(artifact);

    return Boolean(
      outputs.echo ||
        outputs.coreImagePrompt ||
        outputs.song ||
        outputs.youtube
    );
  }).length;
  const activeFingerprint = activeArtifact
    ? getArtifactFingerprint(activeArtifact)
    : "";

  return (
    <aside className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
        Saved Artifacts
      </h2>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        Select an artifact to restore its card, context, and outputs.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]">
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300/75">
          {savedArtifacts.length} saved
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-emerald-100/70">
          {fullCastCount} full cast
        </span>
        <span className="rounded-full border border-purple-300/20 bg-purple-400/10 px-2 py-0.5 text-purple-100/70">
          {packageOutputCount} outputs
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.04] p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/70">
          Memory
        </div>

        {hasArtifactMemory ? (
          <div className="mt-3 space-y-3">
            {artifactMemory.sections.map((section) => (
              <MemoryList
                key={section.type}
                title={section.title}
                items={section.items}
              />
            ))}
            <MemoryList
              title="Recurring Core Objects"
              items={artifactMemory.coreObjects}
            />
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-400">
            More casts are needed before patterns emerge.
          </p>
        )}
      </div>

      {visibleArtifacts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-400/10 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">
            Archive Empty
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300/85 [overflow-wrap:anywhere]">
            Saved artifacts will appear here after you generate a cast. They preserve the card, cast context, and any package outputs you create.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleArtifacts.map((artifact, index) => {
            const inputPreview = getArtifactInput(artifact);
            const sourceCast = getArtifactSourceCast(artifact);
            const isFullyReloadable = Boolean(sourceCast);
            const artifactMood = inferArtifactMood(artifact, sourceCast);
            const packageOutputs = getArtifactPackageOutputs(artifact);
            const outputLabels = [
              packageOutputs.echo ? "Echo" : "",
              packageOutputs.coreImagePrompt ? "Image" : "",
              packageOutputs.suno || packageOutputs.song ? "Song" : "",
              packageOutputs.youtube ? "YouTube" : "",
            ].filter(Boolean);
            const recentlyViewed = isRecentlyViewed(artifact.viewedAt);
            const isActive =
              getArtifactFingerprint(artifact) === activeFingerprint;
            const savedTimeLabel = formatSavedTimestamp(artifact.savedAt);
            const viewedTimeLabel = formatSavedTimestamp(artifact.viewedAt);

            return (
              <div
                key={`${artifact.title}-${artifact.savedAt}-${index}`}
                className={`group relative rounded-2xl border p-3 text-left transition-all duration-200 ease-out ${
                  isActive
                    ? "border-cyan-200/90 bg-cyan-400/20 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-200/35"
                    : "border-white/10 bg-black/30 hover:border-cyan-300/40 hover:bg-cyan-950/30"
                }`}
              >
                {isActive && (
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-cyan-200/80 shadow-[0_0_18px_rgba(103,232,249,0.55)]" />
                )}

                <button
                  type="button"
                  onClick={() => deleteArtifact(index)}
                  aria-label="Delete saved artifact"
                  className="absolute right-2 top-2 text-xs text-red-300 opacity-0 hover:text-red-200 group-hover:opacity-100"
                >
                  &times;
                </button>

                <button
                  type="button"
                  onClick={() => onSelectArtifact(artifact)}
                  aria-current={isActive ? "true" : undefined}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-2 pr-5">
                    <div className="min-w-0">
                      {isActive && (
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex rounded-full border border-cyan-200/35 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-50 shadow-[0_0_12px_rgba(103,232,249,0.16)]">
                            Active
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/55">
                            Shown now
                          </span>
                        </div>
                      )}

                      <div
                        className={`line-clamp-2 break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere] ${
                          isActive ? "text-cyan-50" : "text-white"
                        }`}
                      >
                        {artifact.title || "Untitled Artifact"}
                      </div>
                    </div>

                    {savedTimeLabel && (
                      <div className="w-fit max-w-full rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300/80">
                        <span className="text-slate-500">Saved</span>{" "}
                        {savedTimeLabel}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isFullyReloadable
                          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100/80"
                          : "border-amber-300/25 bg-amber-400/10 text-amber-100/75"
                      }`}
                    >
                      {isFullyReloadable ? "Full cast" : "Artifact only"}
                    </span>

                    <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/65">
                      Mood: {formatMoodLabel(artifactMood)}
                    </span>

                    {recentlyViewed && (
                      <span className="rounded-full border border-cyan-200/25 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-50/75">
                        Recently Viewed
                      </span>
                    )}

                    {outputLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-purple-300/25 bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-100/80"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {viewedTimeLabel && (
                    <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <span className="text-slate-400/80">Last viewed</span>{" "}
                      {viewedTimeLabel}
                    </div>
                  )}

                  {!isFullyReloadable && (
                    <div className="mt-2 rounded-xl border border-amber-300/10 bg-amber-400/[0.04] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100/60">
                      Partial record: card restores; cast context may be missing.
                    </div>
                  )}

                  {artifact.subtitle && (
                    <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Essence
                      </div>
                      <div className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-200/80 [overflow-wrap:anywhere]">
                        {artifact.subtitle}
                      </div>
                    </div>
                  )}

                  {inputPreview && (
                    <div className="mt-2.5 rounded-xl border border-cyan-300/10 bg-cyan-400/10 px-2.5 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70">
                        Focus
                      </div>
                      <div className="mt-1 line-clamp-2 break-words text-xs leading-5 text-cyan-50/85 [overflow-wrap:anywhere]">
                        {inputPreview}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
