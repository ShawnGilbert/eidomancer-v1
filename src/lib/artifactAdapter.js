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

function buildSections(cast) {
  const signal = getSection(cast, "signal");
  const tension = getSection(cast, "tension");
  const pattern = getSection(cast, "pattern");
  const insight = getSection(cast, "insight");
  const essence =
    cleanText(cast?.echo) ||
    getSection(cast, "recommendation") ||
    getSection(cast, "guidance");

  return [
    {
      id: "signal",
      title: "Signal",
      position: "leftTop",
      short: signal,
      full: signal,
    },
    {
      id: "tension",
      title: "Tension",
      position: "rightTop",
      short: tension,
      full: tension,
    },
    {
      id: "pattern",
      title: "Pattern",
      position: "leftMiddle",
      short: pattern,
      full: pattern,
    },
    {
      id: "insight",
      title: "Insight",
      position: "rightMiddle",
      short: insight,
      full: insight,
    },
    {
      id: "essence",
      title: "Essence",
      position: "bottomCenter",
      short: essence,
      full: essence,
    },
  ].filter((section) => section.short || section.full);
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
    subtitle: cleanText(cast?.echo) || "An Eidomancer symbolic artifact",
    createdAt: cast?.createdAt || new Date().toISOString(),

    image:
      cast?.coreCard?.imageUrl ||
      `${window.location.origin}/metronome_core.png`,

    input:
      cleanText(cast?.question) ||
      cleanText(cast?.metadata?.dailyFocus) ||
      "No explicit input was provided for this cast.",

    coreObject:
      cleanText(cast?.coreCard?.description) ||
      cleanText(cast?.coreCard?.imagePrompt) ||
      "No core object defined.",

    sections: buildSections(cast),

    sourceCast: cast,
  };
}