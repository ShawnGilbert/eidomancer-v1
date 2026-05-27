import { deriveCoreCardFromCast } from "./castToArtifact";

const SECTION_LABELS = {
  signal: "Signal",
  tension: "Tension",
  pattern: "Pattern",
  insight: "Insight",
  essence: "Essence",
  echo: "Echo",
  poem: "Poem",
  guidance: "Guidance",
  recommendation: "Guidance",
  advice: "Guidance",
  action: "Guidance",
};

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function cleanArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

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

function compactMemoryLabel(value = "", maxLength = 48) {
  const cleaned = cleanText(value).replace(/\s+/g, " ");
  const base = cleaned.replace(/[.!?:;,\-–—]+$/g, "");

  if (!base) return "";
  if (cleaned.endsWith("...") && cleaned.length <= maxLength + 3) return cleaned;
  if (base.length <= maxLength) return base;

  return `${base.slice(0, maxLength).trim().replace(/[.!?:;,\-–—]+$/g, "")}...`;
}

function firstMeaningfulPhrase(value = "") {
  const cleaned = cleanText(value).replace(/\s+/g, " ");
  const firstSentence = cleaned.split(/[.!?]/).find((part) => cleanText(part));
  const firstClause = cleanText(firstSentence || cleaned)
    .split(/[,;:–—]/)
    .find((part) => cleanText(part));

  return cleanText(firstClause || firstSentence || cleaned);
}

function deriveMemoryLabel({ memoryLabel = "", title = "", name = "", label = "", text = "" } = {}) {
  const existing = compactMemoryLabel(memoryLabel);

  if (existing && !GENERIC_MEMORY_LABELS.has(existing.toLowerCase())) {
    return existing;
  }

  const explicit = cleanText(title || name || label);

  if (explicit && !GENERIC_MEMORY_LABELS.has(explicit.toLowerCase())) {
    return compactMemoryLabel(explicit);
  }

  return compactMemoryLabel(firstMeaningfulPhrase(text));
}

function getSectionType(section = {}) {
  return cleanText(section.type || section.id || section.title).toLowerCase();
}

function getSectionContent(section = {}) {
  return cleanText(
    section.content ||
      section.full ||
      section.body ||
      section.short ||
      section.description
  );
}

function normalizeSection(section, index = 0) {
  if (typeof section === "string") {
    return {
      id: `section-${index}`,
      type: "section",
      title: "Section",
      short: cleanText(section),
      full: cleanText(section),
      memoryLabel: deriveMemoryLabel({ text: section }),
      action: "",
      position: "",
    };
  }

  const safeSection = cleanObject(section);
  const type = getSectionType(safeSection) || "section";
  const title = cleanText(safeSection.title || safeSection.label) || SECTION_LABELS[type] || "Section";
  const content = getSectionContent(safeSection);

  return {
    ...safeSection,
    id: cleanText(safeSection.id) || type || `section-${index}`,
    type,
    title,
    label: cleanText(safeSection.label) || title,
    short: cleanText(safeSection.short) || content,
    full: cleanText(safeSection.full) || content,
    content,
    memoryLabel: deriveMemoryLabel({
      memoryLabel: safeSection.memoryLabel,
      title: safeSection.title,
      name: safeSection.name,
      label: safeSection.label,
      text: content,
    }),
    action: cleanText(safeSection.action),
    position: cleanText(safeSection.position),
  };
}

function buildLegacySections(artifact = {}) {
  return [
    ["signal", artifact.signal],
    ["tension", artifact.tension],
    ["pattern", artifact.pattern],
    ["insight", artifact.insight],
    ["essence", artifact.essence || artifact.coreObject],
    ["poem", artifact.poem],
    ["echo", artifact.echo],
    [
      "guidance",
      artifact.guidance ||
        artifact.recommendation ||
        artifact.advice ||
        artifact.action,
    ],
  ]
    .filter(([, value]) => cleanText(value))
    .map(([type, value]) =>
      normalizeSection({
        id: type,
        type,
        title: SECTION_LABELS[type],
        short: value,
        full: value,
      })
    );
}

export function normalizePackageOutputs(artifact = {}) {
  const safeArtifact = cleanObject(artifact);
  const outputs = cleanObject(
    safeArtifact.packageOutputs ||
      safeArtifact.generatedOutputs ||
      safeArtifact.outputs
  );

  return {
    ...outputs,
    ...(safeArtifact.echoPrompt && !outputs.echo
      ? {
          echo: {
            title: safeArtifact.title || "Echo",
            prompt: cleanText(safeArtifact.echoPrompt),
          },
        }
      : {}),
    ...((outputs.suno || safeArtifact.songPackage) && !outputs.song
      ? { song: outputs.suno || safeArtifact.songPackage }
      : {}),
    ...((safeArtifact.sunoStylePrompt || safeArtifact.lyrics) && !outputs.song
      ? {
          song: {
            songTitle:
              safeArtifact.songTitle || safeArtifact.title || "Untitled Song",
            sunoStylePrompt: cleanText(safeArtifact.sunoStylePrompt),
            lyrics: cleanText(safeArtifact.lyrics),
          },
        }
      : {}),
  };
}

export function getArtifactText(artifact = {}, key, fallback = "") {
  return cleanText(cleanObject(artifact)[key]) || fallback;
}

export function getNormalizedArtifactSections(artifact = {}) {
  const safeArtifact = cleanObject(artifact);
  const sections = cleanArray(safeArtifact.sections).map(normalizeSection);

  return sections.length ? sections : buildLegacySections(safeArtifact);
}

export function getArtifactSection(artifact = {}, type) {
  const expectedType = cleanText(type).toLowerCase();

  return (
    getNormalizedArtifactSections(artifact).find((section) => {
      const sectionType = cleanText(section.type || section.id).toLowerCase();
      const sectionTitle = cleanText(section.title).toLowerCase();

      return sectionType === expectedType || sectionTitle === expectedType;
    }) || null
  );
}

export function getArtifactSectionText(artifact = {}, type) {
  const section = getArtifactSection(artifact, type);

  return section ? cleanText(section.content || section.full || section.short) : "";
}

export function normalizeArtifact(artifact = {}) {
  const safeArtifact = cleanObject(artifact);
  const metadata = cleanObject(safeArtifact.metadata);
  const memoryLabels = cleanObject(safeArtifact.memoryLabels);
  const sections = getNormalizedArtifactSections(safeArtifact);
  const sourceCast = cleanObject(
    safeArtifact.sourceCast ||
      safeArtifact.fullCast ||
      safeArtifact.cast ||
      safeArtifact.source?.cast
  );
  const coreCard = deriveCoreCardFromCast({
    ...sourceCast,
    ...safeArtifact,
    coreCard: {
      ...cleanObject(sourceCast.coreCard),
      ...cleanObject(safeArtifact.coreCard),
    },
    sections,
  });
  const sectionMemoryLabels = sections.reduce((labels, section) => {
    const type = cleanText(section.type || section.id).toLowerCase();

    if (type && section.memoryLabel && !labels[type]) {
      labels[type] = section.memoryLabel;
    }

    if (section.title === "Guidance" && section.memoryLabel && !labels.guidance) {
      labels.guidance = section.memoryLabel;
    }

    return labels;
  }, {});
  // Artifact records can come from current casts, saved archives, or older prototypes.
  // This defensive layer keeps rendering stable without forcing a storage migration.
  return {
    ...safeArtifact,
    artifactVersion: cleanText(safeArtifact.artifactVersion) || "v1",
    id: cleanText(safeArtifact.id),
    title: cleanText(safeArtifact.title) || cleanText(coreCard.title) || "Untitled Artifact",
    subtitle: cleanText(safeArtifact.subtitle) || cleanText(coreCard.subtitle),
    image:
      cleanText(safeArtifact.image) ||
      cleanText(coreCard.imageUrl) ||
      cleanText(coreCard.generatedImageUrl),
    input: safeArtifact.input || "",
    coreObject: cleanText(safeArtifact.coreObject) || cleanText(coreCard.coreObject),
    coreCard,
    sections,
    memoryLabels: {
      ...sectionMemoryLabels,
      ...(coreCard.memoryLabels || {}),
      ...memoryLabels,
      coreObject: deriveMemoryLabel({
        memoryLabel: memoryLabels.coreObject,
        title:
          coreCard.name ||
          coreCard.title ||
          safeArtifact.title,
        text: safeArtifact.coreObject || coreCard.coreObject || coreCard.description,
      }),
    },
    actions: cleanArray(safeArtifact.actions),
    packageOutputs: normalizePackageOutputs(safeArtifact),
    mood: cleanText(safeArtifact.mood || safeArtifact.tone),
    metadata,
    ...(Object.keys(sourceCast).length ? { sourceCast } : {}),
  };
}
