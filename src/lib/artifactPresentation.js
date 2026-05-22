import { DEFAULT_THEME_ID, getDefaultThemeMetadata } from "./themePalettes";

export const ARTIFACT_PRESENTATION = {
  themeId: DEFAULT_THEME_ID,
  theme: getDefaultThemeMetadata(),
  panelStyle: "artifact-viewer",
  emphasisLevel: "primary",
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

export function getDepthLayerTypes() {
  return DEPTH_LAYER_ORDER.map((type) => {
    const presentation = getSectionPresentation(type);
    return [type, presentation.label];
  });
}
