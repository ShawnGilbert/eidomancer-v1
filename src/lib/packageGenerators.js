// D:\eidomancer\src\lib\packageGenerators.js

function joinTags(tags) {
  return tags.filter(Boolean).join(", ");
}

function normalizeText(value, fallback = "Not generated yet.") {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function getSectionContent(record, type, fallback = "Not generated yet.") {
  if (!record || !Array.isArray(record.sections)) return fallback;

  const match = record.sections.find((section) => section?.type === type);
  if (!match || typeof match.content !== "string" || !match.content.trim()) {
    return fallback;
  }

  return match.content.trim();
}

function getQuestion(record) {
  return normalizeText(record?.question || record?.input, "No question provided.");
}

function getTheme(record) {
  return normalizeText(record?.theme, "The Emergent Ones");
}

function getTitle(record) {
  return normalizeText(record?.coreCard?.title || record?.title, "Untitled Cast");
}

function getSubtitle(record) {
  return normalizeText(
    record?.coreCard?.subtitle || record?.subtitle,
    "A pattern asks to be named."
  );
}

function getHook(record) {
  return normalizeText(
    record?.coreCard?.hook || getSectionContent(record, "echo", ""),
    "The signal is still forming."
  );
}

function flattenRecord(record) {
  return {
    title: getTitle(record),
    subtitle: getSubtitle(record),
    hook: getHook(record),
    question: getQuestion(record),
    theme: getTheme(record),
    signal: getSectionContent(record, "signal"),
    tension: getSectionContent(record, "tension"),
    pattern: getSectionContent(record, "pattern"),
    poem: getSectionContent(record, "poem"),
    echo: getSectionContent(record, "echo"),
  };
}

export const IMAGE_FORMATS = {
  CORE: {
    key: "CORE",
    aspectRatio: "2:3",
    safeMargin: 0.05,
    titlePlacement: "bottom",
    borderStyle: "ornate tarot frame",
    allowTitleText: true,
    allowShortPhrase: false,
    intendedUse: "Primary Eidomancer core card",
  },
  ECHO: {
    key: "ECHO",
    aspectRatio: "16:9",
    safeMargin: 0.1,
    titlePlacement: "none",
    borderStyle: "none or extremely subtle",
    allowTitleText: false,
    allowShortPhrase: true,
    intendedUse: "Wide emotionally sticky share image",
  },
  SUNO: {
    key: "SUNO",
    aspectRatio: "2:3",
    safeMargin: 0.08,
    titlePlacement: "bottom",
    borderStyle: "ornate tarot frame",
    allowTitleText: true,
    allowShortPhrase: false,
    intendedUse: "Tarot-shaped mini album cover",
  },
  SPECTERR: {
    key: "SPECTERR",
    aspectRatio: "16:9",
    safeMargin: 0.15,
    titlePlacement: "bottom center title plate",
    borderStyle: "ornate outer frame plus wide crop-safe outer margins",
    allowTitleText: true,
    allowShortPhrase: true,
    intendedUse: "YouTube/Specterr-safe video image",
  },
};

export function getFormatInstructions(type) {
  switch (type) {
    case "CORE":
      return [
        "Create a vertical tarot-style core card.",
        "Use a 2:3 portrait composition.",
        "Use an ornate tarot border/frame.",
        "Keep all important visual elements comfortably inside the frame.",
        "Include the card title only, placed at the bottom like a tarot card.",
        "Do not add extra labels, subtitles, or album-style metadata.",
        "The feeling should be mystical, symbolic, polished, and distinctly Eidomancer."
      ].join(" ");

    case "ECHO":
      return [
        "Create a wide cinematic Echo image.",
        "Use a 16:9 composition.",
        "This is not a tarot card and should not be framed like one.",
        "Do not put the word 'Echo' in the image.",
        "Do not use the cast title as the main image title.",
        "If text is used at all, use only one very short takeaway phrase from the cast.",
        "The image should feel like the blended emotional echo of the input, the cast, and the core card.",
        "Make it dynamic, socially shareable, cinematic, symbolic, and emotionally compressed."
      ].join(" ");

    case "SUNO":
      return [
        "Create a tarot-shaped Suno cover image.",
        "Use a 2:3 portrait composition.",
        "Style it like a mini album cover fused with a tarot card.",
        "Use an ornate tarot frame.",
        "Include the song title at the bottom in a clean, readable title area.",
        "Do not add extra metadata, platform labels, or subtitles unless explicitly requested.",
        "Keep the composition elegant, music-forward, symbolic, and visually strong at small sizes."
      ].join(" ");

    case "SPECTERR":
      return [
        "Create a true 16:9 widescreen image for Specterr/YouTube.",
        "All important content must live inside a smaller centered inner composition.",
        "Shrink the inner artwork to roughly 85% of the total canvas so there are wide crop-safe outer margins.",
        "Treat the outer edges as a sacrificial safety zone because Specterr cuts off the edges.",
        "Use a dark, simple, non-distracting outer margin area or restrained border treatment.",
        "Place the song title like an album cover, ideally in a bottom title plate or other stable safe-zone placement.",
        "Keep faces, focal objects, and all text away from the outer edges.",
        "This should feel like a finished music visual, not a tarot card."
      ].join(" ");

    default:
      return "";
  }
}

function buildImagePrompt({ cast, type }) {
  const formatInstructions = getFormatInstructions(type);

  switch (type) {
    case "CORE":
      return [
        `Create an Eidomancer Core Card for "${cast.title}" under the ${cast.theme} theme.`,
        `Signal: ${cast.signal}`,
        `Tension: ${cast.tension}`,
        `Pattern: ${cast.pattern}`,
        `Poem tone: ${cast.poem}`,
        `Core hook: ${cast.hook}`,
        formatInstructions
      ].join(" ");

    case "ECHO":
      return [
        `Create an Eidomancer Echo image inspired by the cast "${cast.title}" under the ${cast.theme} theme.`,
        `This image must be generated from the combination of the source content, the cast, and the implied visual energy of the core card.`,
        `Emotional compression: ${cast.echo}`,
        `Pattern to visualize: ${cast.pattern}`,
        `Signal tone: ${cast.signal}`,
        `Tension pressure: ${cast.tension}`,
        `Hook to compress into visual form: ${cast.hook}`,
        formatInstructions
      ].join(" ");

    case "SUNO":
      return [
        `Create a Suno cover image for the song "${cast.title}" under the ${cast.theme} theme.`,
        `Primary emotional basis: ${cast.signal}`,
        `Core tension: ${cast.tension}`,
        `Pattern field: ${cast.pattern}`,
        `Hook: ${cast.hook}`,
        `The image should feel like the song version of the cast.`,
        formatInstructions
      ].join(" ");

    case "SPECTERR":
      return [
        `Create a Specterr/YouTube promotional image for the song "${cast.title}" under the ${cast.theme} theme.`,
        `Primary emotional basis: ${cast.signal}`,
        `Core tension: ${cast.tension}`,
        `Pattern field: ${cast.pattern}`,
        `Echo compression: ${cast.echo}`,
        `Hook: ${cast.hook}`,
        `This should function like a finished album-cover-style visual for a music video.`,
        formatInstructions
      ].join(" ");

    default:
      return "";
  }
}

export function generateCoreCard(record) {
  const cast = flattenRecord(record);

  return {
    headline: cast.title,
    subhead: cast.subtitle,
    hook: cast.hook,
    question: cast.question,
    sections: {
      signal: cast.signal,
      tension: cast.tension,
      pattern: cast.pattern,
      poem: cast.poem,
      echo: cast.echo,
    },
    footer: `Theme: ${cast.theme}`,
    imageFormat: IMAGE_FORMATS.CORE,
    imagePrompt: buildImagePrompt({ cast, type: "CORE" }),
  };
}

export function generateEcho(record) {
  const cast = flattenRecord(record);

  return {
    title: cast.title,
    concept:
      "A symbolic, meme-capable wide image prompt that compresses the cast into one emotionally sticky visual echo.",
    imageFormat: IMAGE_FORMATS.ECHO,
    prompt: buildImagePrompt({ cast, type: "ECHO" }),
    shortPhrase: cast.hook,
  };
}

export function generateLyrics(record) {
  const cast = flattenRecord(record);

  return {
    title: cast.title,
    lyrics: `Verse 1
${cast.signal}

Pre-Chorus
${cast.tension}

Chorus
${cast.echo}

Verse 2
${cast.pattern}

Bridge
${cast.poem}

Outro
${cast.hook}`,
  };
}

export function generateSuno(record) {
  const cast = flattenRecord(record);

  return {
    title: cast.title,
    stylePrompt: `Cinematic, emotionally intelligent, future-mystic, symbolic, reflective, grounded but transcendent, with strong melodic payoff and memorable chorus. Theme focus: ${cast.echo}. Emotional basis: ${cast.signal}. Core hook: ${cast.hook}`,
    vocalMood: "Reflective, sincere, vivid, quietly intense",
    hook: cast.hook,
    imageFormat: IMAGE_FORMATS.SUNO,
    coverPrompt: buildImagePrompt({ cast, type: "SUNO" }),
  };
}

export function generateSpecterr(record) {
  const cast = flattenRecord(record);

  return {
    title: cast.title,
    subtitle: cast.subtitle,
    tagline: cast.hook,
    imageFormat: IMAGE_FORMATS.SPECTERR,
    prompt: buildImagePrompt({ cast, type: "SPECTERR" }),
  };
}

export function generateYouTubePackage(record) {
  const cast = flattenRecord(record);

  const tags = [
    "Eidomancer",
    cast.theme,
    "AI music",
    "symbolic cast",
    "meaning compression",
    "philosophy",
    cast.title,
  ];

  return {
    titleOptions: [
      `${cast.title} | Eidomancer Cast`,
      `${cast.hook} | Eidomancer`,
      `${cast.title} - Signal from ${cast.theme}`,
    ],
    description: `${cast.title}

${cast.subtitle}

Question: ${cast.question}

Signal
${cast.signal}

Tension
${cast.tension}

Pattern
${cast.pattern}

Poem
${cast.poem}

Echo
${cast.echo}`,
    tags,
    tagString: joinTags(tags),
  };
}

export function generateFullPackage(record) {
  const cast = flattenRecord(record);
  const youtube = generateYouTubePackage(record);
  const lyrics = generateLyrics(record);
  const suno = generateSuno(record);
  const echo = generateEcho(record);
  const specterr = generateSpecterr(record);
  const coreCard = generateCoreCard(record);

  const bundle = [
    "============================",
    "EIDOMANCER FULL PACKAGE",
    "============================",
    "",
    "TITLE:",
    cast.title,
    "",
    "SUBTITLE:",
    cast.subtitle,
    "",
    "HOOK:",
    cast.hook,
    "",
    "----------------------------",
    "QUESTION",
    "----------------------------",
    cast.question,
    "",
    "----------------------------",
    "SIGNAL",
    "----------------------------",
    cast.signal,
    "",
    "----------------------------",
    "TENSION",
    "----------------------------",
    cast.tension,
    "",
    "----------------------------",
    "PATTERN",
    "----------------------------",
    cast.pattern,
    "",
    "----------------------------",
    "POEM",
    "----------------------------",
    cast.poem,
    "",
    "----------------------------",
    "ECHO",
    "----------------------------",
    cast.echo,
    "",
    "----------------------------",
    "YOUTUBE TITLE OPTIONS",
    "----------------------------",
    ...youtube.titleOptions,
    "",
    "----------------------------",
    "DESCRIPTION",
    "----------------------------",
    youtube.description,
    "",
    "----------------------------",
    "TAGS",
    "----------------------------",
    youtube.tagString || youtube.tags.join(", "),
    "",
    "----------------------------",
    "CORE CARD IMAGE PROMPT",
    "----------------------------",
    coreCard.imagePrompt,
    "",
    "----------------------------",
    "ECHO IMAGE PROMPT",
    "----------------------------",
    echo.prompt,
    "",
    "----------------------------",
    "SUNO STYLE PROMPT",
    "----------------------------",
    suno.stylePrompt,
    "",
    "----------------------------",
    "SUNO COVER PROMPT",
    "----------------------------",
    suno.coverPrompt,
    "",
    "----------------------------",
    "SPECTERR IMAGE PROMPT",
    "----------------------------",
    specterr.prompt,
    "",
    "----------------------------",
    "LYRICS",
    "----------------------------",
    lyrics.lyrics,
    "",
    "============================",
    "END PACKAGE",
    "============================",
  ].join("\n");

  return {
    title: cast.title,
    bundle,
  };
}