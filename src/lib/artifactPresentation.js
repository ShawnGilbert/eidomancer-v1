import { DEFAULT_THEME_ID, getDefaultThemeMetadata } from "./themePalettes";

export const ARTIFACT_PRESENTATION = {
  themeId: DEFAULT_THEME_ID,
  theme: getDefaultThemeMetadata(),
  panelStyle: "artifact-viewer",
  emphasisLevel: "primary",
  // TODO: Future frame variants should map theme metadata to presentation only.
  symbolicTone: "emergent-cyber-tarot",
  frameVariant: "tarot-artifact",
  moodGlow: "subtle",
  typographyVariant: "compact-codex",
};

export const ARTIFACT_SECTION_POSITIONS = {
  leftTop: "left-[4%] top-[26%]",
  leftMiddle: "left-[4%] top-[47%]",
  rightTop: "right-[4%] top-[26%]",
  rightMiddle: "right-[4%] top-[47%]",
  bottomCenter: "left-1/2 bottom-[8%] -translate-x-1/2",
};

// Presentation-only accents keep section identity out of artifact meaning data.
export const ARTIFACT_SECTION_ACCENTS = {
  cyan: {
    label: "text-cyan-300",
    mutedLabel: "text-cyan-200/70",
    closedPanel: "border-cyan-300/20 hover:border-cyan-300/60",
    openPanel:
      "border-cyan-300/75 shadow-[0_0_20px_rgba(34,211,238,0.22)]",
    mobilePanel: "border-cyan-300/20 border-l-cyan-300/55 bg-cyan-400/[0.05]",
    actionPanel: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  },
  amber: {
    label: "text-amber-300",
    mutedLabel: "text-amber-200/70",
    closedPanel: "border-amber-300/20 hover:border-amber-300/55",
    openPanel:
      "border-amber-300/70 shadow-[0_0_20px_rgba(251,191,36,0.18)]",
    mobilePanel: "border-amber-300/20 border-l-amber-300/50 bg-amber-400/[0.05]",
    actionPanel: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  },
  violet: {
    label: "text-violet-300",
    mutedLabel: "text-violet-200/70",
    closedPanel: "border-violet-300/20 hover:border-violet-300/55",
    openPanel:
      "border-violet-300/70 shadow-[0_0_20px_rgba(167,139,250,0.18)]",
    mobilePanel: "border-violet-300/20 border-l-violet-300/50 bg-violet-400/[0.05]",
    actionPanel: "border-violet-300/20 bg-violet-400/10 text-violet-100",
  },
  blue: {
    label: "text-blue-300",
    mutedLabel: "text-blue-200/70",
    closedPanel: "border-blue-300/20 hover:border-blue-300/55",
    openPanel:
      "border-blue-300/70 shadow-[0_0_20px_rgba(96,165,250,0.18)]",
    mobilePanel: "border-blue-300/20 border-l-blue-300/50 bg-blue-400/[0.05]",
    actionPanel: "border-blue-300/20 bg-blue-400/10 text-blue-100",
  },
  emerald: {
    label: "text-emerald-300",
    mutedLabel: "text-emerald-200/70",
    closedPanel: "border-emerald-300/20 hover:border-emerald-300/55",
    openPanel:
      "border-emerald-300/70 shadow-[0_0_20px_rgba(52,211,153,0.18)]",
    mobilePanel:
      "border-emerald-300/20 border-l-emerald-300/50 bg-emerald-400/[0.05]",
    actionPanel: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  },
  fuchsia: {
    label: "text-fuchsia-300",
    mutedLabel: "text-fuchsia-200/70",
    closedPanel: "border-fuchsia-300/20 hover:border-fuchsia-300/55",
    openPanel:
      "border-fuchsia-300/70 shadow-[0_0_20px_rgba(232,121,249,0.18)]",
    mobilePanel:
      "border-fuchsia-300/20 border-l-fuchsia-300/50 bg-fuchsia-400/[0.05]",
    actionPanel: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100",
  },
};

export const CORE_CARD_DERIVED_AURAS = [
  {
    key: "cyan",
    primary: "rgba(34, 211, 238, 0.18)",
    secondary: "rgba(14, 165, 233, 0.1)",
    halo: "rgba(125, 211, 252, 0.16)",
    frame: "border-cyan-200/15",
  },
  {
    key: "amber",
    primary: "rgba(251, 191, 36, 0.16)",
    secondary: "rgba(245, 158, 11, 0.08)",
    halo: "rgba(253, 224, 71, 0.12)",
    frame: "border-amber-200/15",
  },
  {
    key: "violet",
    primary: "rgba(167, 139, 250, 0.17)",
    secondary: "rgba(124, 58, 237, 0.08)",
    halo: "rgba(196, 181, 253, 0.13)",
    frame: "border-violet-200/15",
  },
  {
    key: "emerald",
    primary: "rgba(52, 211, 153, 0.15)",
    secondary: "rgba(16, 185, 129, 0.08)",
    halo: "rgba(110, 231, 183, 0.12)",
    frame: "border-emerald-200/15",
  },
  {
    key: "crimson",
    primary: "rgba(232, 121, 249, 0.15)",
    secondary: "rgba(244, 63, 94, 0.08)",
    halo: "rgba(251, 113, 133, 0.13)",
    frame: "border-rose-200/15",
  },
];

export const CORE_CARD_THEME_VISUALS = {
  amber: {
    name: "Amber",
    palette: ["#120b0b", "#f59e0b", "#facc15", "#fed7aa"],
    background:
      "radial-gradient(circle at 50% 28%, rgba(251,191,36,0.28), transparent 34%), linear-gradient(145deg, #160c08, #071019 68%)",
    aura: "rgba(251, 191, 36, 0.24)",
    footer: "Work / Endurance",
  },
  cyan: {
    name: "Cyan",
    palette: ["#071019", "#22d3ee", "#38bdf8", "#a5f3fc"],
    background:
      "radial-gradient(circle at 50% 25%, rgba(34,211,238,0.27), transparent 34%), linear-gradient(145deg, #04131f, #020817 72%)",
    aura: "rgba(34, 211, 238, 0.24)",
    footer: "Signal / Clarity",
  },
  violet: {
    name: "Violet",
    palette: ["#100718", "#a78bfa", "#f0abfc", "#c4b5fd"],
    background:
      "radial-gradient(circle at 50% 25%, rgba(167,139,250,0.28), transparent 36%), linear-gradient(145deg, #12071f, #020817 72%)",
    aura: "rgba(167, 139, 250, 0.24)",
    footer: "Mystery / Threshold",
  },
  emerald: {
    name: "Emerald",
    palette: ["#06111f", "#34d399", "#a7f3d0", "#22d3ee"],
    background:
      "radial-gradient(circle at 50% 26%, rgba(52,211,153,0.26), transparent 35%), linear-gradient(145deg, #031713, #020817 72%)",
    aura: "rgba(52, 211, 153, 0.22)",
    footer: "Growth / Repair",
  },
  crimson: {
    name: "Crimson",
    palette: ["#18070c", "#fb7185", "#f97316", "#fecdd3"],
    background:
      "radial-gradient(circle at 50% 25%, rgba(251,113,133,0.27), transparent 34%), linear-gradient(145deg, #19070c, #020817 72%)",
    aura: "rgba(251, 113, 133, 0.22)",
    footer: "Urgency / Conflict",
  },
};

export const ARTIFACT_SECTION_PRESENTATION = {
  signal: {
    label: "Signal",
    position: "leftTop",
    sectionAccent: "cyan",
    symbolicTone: "signal",
  },
  tension: {
    label: "Tension",
    position: "rightTop",
    sectionAccent: "amber",
    symbolicTone: "pressure",
  },
  pattern: {
    label: "Pattern",
    position: "leftMiddle",
    sectionAccent: "violet",
    symbolicTone: "structure",
  },
  insight: {
    label: "Insight",
    position: "rightMiddle",
    sectionAccent: "blue",
    symbolicTone: "clarity",
  },
  essence: {
    label: "Essence",
    position: "bottomCenter",
    sectionAccent: "cyan",
    symbolicTone: "core",
  },
  echo: {
    label: "Echo",
    position: "bottomCenter",
    sectionAccent: "emerald",
    symbolicTone: "resonance",
  },
  guidance: {
    label: "Guidance",
    position: "bottomCenter",
    sectionAccent: "fuchsia",
    symbolicTone: "instruction",
  },
};

export const DEPTH_LAYER_ORDER = [
  "signal",
  "tension",
  "pattern",
  "insight",
  "essence",
  "echo",
  "guidance",
];

export function getArtifactPresentation() {
  return ARTIFACT_PRESENTATION;
}

export function getSectionPresentation(type) {
  return (
    ARTIFACT_SECTION_PRESENTATION[type] || {
      label: "Section",
      position: "leftTop",
      sectionAccent: "cyan",
      symbolicTone: "section",
    }
  );
}

export function getSectionAccentStyles(typeOrAccent) {
  const sectionAccent =
    ARTIFACT_SECTION_PRESENTATION[typeOrAccent]?.sectionAccent || typeOrAccent;

  return ARTIFACT_SECTION_ACCENTS[sectionAccent] || ARTIFACT_SECTION_ACCENTS.cyan;
}

export function getDepthLayerTypes() {
  return DEPTH_LAYER_ORDER.map((type) => {
    const presentation = getSectionPresentation(type);
    return [type, presentation.label];
  });
}

export function getCoreDerivedAuras() {
  return CORE_CARD_DERIVED_AURAS;
}

export function getCoreCardThemeVisual(themeColor = "cyan") {
  return CORE_CARD_THEME_VISUALS[themeColor] || CORE_CARD_THEME_VISUALS.cyan;
}
