export const OUTPUT_KEYS = {
  CORE_CARD_IMAGE: "coreCardImage",
  CORE_IMAGE_PROMPT: "coreImagePrompt",
  ECHO: "echo",
  SONG: "song",
  YOUTUBE: "youtube",
  FULL_PACKAGE: "fullPackage",
};

export const OUTPUT_REGISTRY = {
  [OUTPUT_KEYS.CORE_CARD_IMAGE]: {
    key: OUTPUT_KEYS.CORE_CARD_IMAGE,
    aliases: ["coreCardGeneratedImage"],
    label: "Core Card Image",
    actionLabel: "Generate Core Card Image",
    successMessage: "Core Card Image generated",
    description: "Generate the real Core Card image from the prepared prompt.",
    intendedUse: "Create the primary tarot-style Core Card artwork.",
    category: "image",
    copyExportCategory: "image",
  },
  [OUTPUT_KEYS.CORE_IMAGE_PROMPT]: {
    key: OUTPUT_KEYS.CORE_IMAGE_PROMPT,
    aliases: ["coreCardImagePrompt", "coreImagePrompt"],
    label: "Core Card Image Prompt",
    actionLabel: "Create Core Image Prompt",
    successMessage: "Core Card Image Prompt created",
    description: "A text-only prompt for a future Core Card image.",
    intendedUse: "Prepare tarot-style Core Card image generation.",
    category: "image-prompt",
    copyExportCategory: "prompt",
  },
  [OUTPUT_KEYS.ECHO]: {
    key: OUTPUT_KEYS.ECHO,
    aliases: ["echoPrompt"],
    label: "Echo Prompt",
    actionLabel: "Create Echo Prompt",
    successMessage: "Echo Prompt created",
    description: "A reusable symbolic prompt derived from the current cast.",
    intendedUse: "Create a shareable Echo image prompt later.",
    category: "image-prompt",
    copyExportCategory: "prompt",
  },
  [OUTPUT_KEYS.SONG]: {
    key: OUTPUT_KEYS.SONG,
    aliases: ["songPackage", "suno"],
    label: "Song Package",
    actionLabel: "Create Song Package",
    successMessage: "Song Package created",
    description: "Text-only song title, style prompt, and lyrics.",
    intendedUse: "Prepare music-generation material without calling audio APIs.",
    category: "audio-package",
    copyExportCategory: "package",
  },
  [OUTPUT_KEYS.YOUTUBE]: {
    key: OUTPUT_KEYS.YOUTUBE,
    aliases: ["youtubePackage"],
    label: "YouTube Package",
    actionLabel: "Create YouTube Package",
    successMessage: "YouTube Package created",
    description: "Text-only title, description, and tags.",
    intendedUse: "Prepare publishing metadata without upload APIs.",
    category: "publishing-package",
    copyExportCategory: "package",
  },
  [OUTPUT_KEYS.FULL_PACKAGE]: {
    key: OUTPUT_KEYS.FULL_PACKAGE,
    aliases: [],
    label: "Full Package",
    actionLabel: "Create Full Package",
    successMessage: "Full Package created",
    description: "Runs the current text-only package outputs together.",
    intendedUse: "Prepare a reusable bundle from the active cast.",
    category: "bundle",
    copyExportCategory: "package",
  },
};

export const OUTPUT_ACTION_ORDER = [
  OUTPUT_KEYS.ECHO,
  OUTPUT_KEYS.CORE_IMAGE_PROMPT,
  OUTPUT_KEYS.CORE_CARD_IMAGE,
  OUTPUT_KEYS.SONG,
  OUTPUT_KEYS.YOUTUBE,
  OUTPUT_KEYS.FULL_PACKAGE,
];

export const GENERATED_OUTPUT_ORDER = [
  OUTPUT_KEYS.ECHO,
  OUTPUT_KEYS.CORE_IMAGE_PROMPT,
  OUTPUT_KEYS.SONG,
  OUTPUT_KEYS.YOUTUBE,
];

export function getOutputDefinition(key) {
  return OUTPUT_REGISTRY[key] || null;
}

export function getOutputLabel(key, fallback = "Package Output") {
  return getOutputDefinition(key)?.label || fallback;
}

export function getOutputActionLabel(key, fallback = "Create Output") {
  return getOutputDefinition(key)?.actionLabel || fallback;
}

export function getOutputSuccessMessage(key, fallback = "Package output created") {
  return getOutputDefinition(key)?.successMessage || fallback;
}

export function getOutputActions() {
  return OUTPUT_ACTION_ORDER.map((key) => [key, getOutputActionLabel(key)]);
}
