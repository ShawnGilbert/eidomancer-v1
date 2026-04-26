// D:\EidomancerProject\eidomancer-app\src\lib\artifactAdapter.js

function cleanText(value = "") {
  return String(value || "").trim();
}

function getSection(cast, type) {
  const sections = Array.isArray(cast?.sections) ? cast.sections : [];
  const match = sections.find(
    (section) => String(section?.type || "").toLowerCase() === type
  );

  return cleanText(match?.content || "");
}

export function castToArtifact(cast) {
  if (!cast) return null;

  const title =
    cleanText(cast?.coreCard?.name) ||
    cleanText(cast?.cardName) ||
    "Untitled Artifact";

  return {
    id: cast?.id || cast?.metadata?.id || `artifact-${Date.now()}`,
    title,
    subtitle: cast?.echo || "An Eidomancer symbolic artifact",
    createdAt: cast?.createdAt || new Date().toISOString(),

    privacy: {
      inputVisible: true,
      censored: false,
    },

    input: {
      type: "daily-cast",
      text:
        cleanText(cast?.question) ||
        cleanText(cast?.metadata?.dailyFocus) ||
        "No explicit input was provided for this cast.",
    },

     coreImageUrl:
  cast?.coreCard?.imageUrl ||
  `${window.location.origin}/metronome_core.png`,

    cast: {
      signal: getSection(cast, "signal"),
      tension: getSection(cast, "tension"),
      pattern: getSection(cast, "pattern"),
      insight: getSection(cast, "insight"),
      essence:
        cleanText(cast?.echo) ||
        getSection(cast, "recommendation") ||
        getSection(cast, "guidance"),
    },

    structure: {
      coreObject:
        cleanText(cast?.coreCard?.description) ||
        cleanText(cast?.coreCard?.imagePrompt) ||
        "No core object defined.",
      mood: cleanText(cast?.tone) || "reflective",
      palette: [],
      symbols: [],
    },

    sourceCast: cast,
  };
}