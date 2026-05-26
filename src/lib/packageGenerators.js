// D:\eidomancer\src\lib\packageGenerators.js

function joinTags(tags) {
  return tags.filter(Boolean).join(", ");
}

const EMPTY_OUTPUT_MARKERS = new Set([
  "not generated yet.",
  "not generated yet",
  "n/a",
  "none",
]);

function cleanText(value) {
  if (typeof value !== "string") return "";

  const text = value.trim();

  if (!text || EMPTY_OUTPUT_MARKERS.has(text.toLowerCase())) {
    return "";
  }

  return text;
}

function normalizeText(value, fallback = "") {
  const text = cleanText(value);
  if (text) return text;
  return fallback;
}

function getSectionContent(record, type, fallback = "") {
  if (!record || !Array.isArray(record.sections)) return fallback;

  const match = record.sections.find(
    (section) => section?.type === type || section?.id === type
  );
  const content = match?.content || match?.full || match?.short;

  const text = cleanText(content);

  if (!match || !text) {
    return fallback;
  }

  return text;
}

function getQuestion(record) {
  return normalizeText(record?.question || record?.input, "");
}

function getTheme(record) {
  return normalizeText(record?.theme, "The Emergent Ones");
}

function getTitle(record) {
  return normalizeText(
    record?.coreCard?.title || record?.coreCard?.name || record?.cardName || record?.title,
    "Untitled Cast"
  );
}

function getSubtitle(record) {
  return normalizeText(
    record?.coreCard?.subtitle || record?.subtitle,
    ""
  );
}

function getHook(record) {
  return normalizeText(
    record?.coreCard?.hook ||
      record?.coreCard?.description ||
      record?.subtitle ||
      getSectionContent(record, "echo", ""),
    ""
  );
}

function getCoreObject(record) {
  return normalizeText(
    record?.coreObject ||
      record?.artifact?.coreObject ||
      record?.coreCard?.visual?.subject ||
      record?.coreCard?.visual?.archetypeFigure ||
      record?.coreCard?.visual?.primaryMotif ||
      record?.coreCard?.description,
    "A symbolic core object emerging from the cast."
  );
}

function getMoodTone(record) {
  return normalizeText(
    record?.mood ||
      record?.tone ||
      record?.coreCard?.imageGeneration?.mood ||
      record?.coreCard?.visual?.atmosphere,
    "Reflective, luminous, and quietly intense."
  );
}

function getVisualAtmosphere(record) {
  const visual = record?.coreCard?.visual || {};

  return normalizeText(
    [
      visual.environment,
      visual.lighting,
      visual.atmosphere,
      visual.paletteHint,
      record?.coreCard?.imageGeneration?.lighting,
      record?.coreCard?.imageGeneration?.palette,
    ]
      .filter(Boolean)
      .join(", "),
    "Ancient-digital atmosphere, restrained cyber-mystic palette, symbolic light."
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
    guidance:
      getSectionContent(record, "guidance", "") ||
      normalizeText(record?.guidance || record?.recommendation, ""),
    coreObject: getCoreObject(record),
    moodTone: getMoodTone(record),
    visualAtmosphere: getVisualAtmosphere(record),
  };
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }

  return "";
}

export function getBestEcho(cast) {
  return firstText(
    cast.echo,
    cast.hook,
    cast.tension,
    cast.pattern,
    cast.signal,
    `${cast.title} asks for one honest signal to become visible.`
  );
}

export function getBestPoem(cast) {
  return firstText(
    cast.poem,
    cast.echo,
    cast.pattern,
    `${getBestEcho(cast)} Let the pattern breathe before it becomes a command.`
  );
}

export function getBestGuidance(cast) {
  return firstText(
    cast.guidance,
    cast.hook,
    cast.tension ? `Move carefully with this tension: ${cast.tension}` : "",
    cast.pattern ? `Name the pattern and choose one grounded next step: ${cast.pattern}` : "",
    `Name one small move that honors ${cast.title}.`
  );
}

export function buildChorus(cast) {
  const chorusSeed = firstText(
    cast.echo,
    cast.hook,
    cast.tension,
    cast.title
  );
  const titleLine =
    cast.title && !chorusSeed.toLowerCase().includes(cast.title.toLowerCase())
      ? `Hold the shape of ${cast.title}.`
      : "";

  return [chorusSeed, titleLine, getBestGuidance(cast)]
    .filter(Boolean)
    .join("\n");
}

function completeCast(record) {
  const cast = flattenRecord(record);
  const echo = getBestEcho(cast);
  const guidance = getBestGuidance({ ...cast, echo });

  return {
    ...cast,
    subtitle:
      cast.subtitle ||
      `A cast about ${cast.title.toLowerCase()} becoming clear enough to act on.`,
    hook: cast.hook || echo,
    question:
      cast.question ||
      `What is ${cast.title} asking me to notice, release, or choose today?`,
    signal:
      cast.signal ||
      `${cast.title} is presenting a signal that wants attention before it turns into noise.`,
    tension:
      cast.tension ||
      "The pressure is between staying vague and choosing one honest next move.",
    pattern:
      cast.pattern ||
      "The same shape keeps returning until it is named, witnessed, and handled with care.",
    echo,
    poem: getBestPoem({ ...cast, echo }),
    guidance,
  };
}

function limitText(value = "", maxLength = 1000) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trim();
}

function getPackageOutput(record, key) {
  return record?.packageOutputs?.[key] || record?.assets?.[key] || null;
}

function limitCommaTags(tags = [], maxLength = 500) {
  const uniqueTags = Array.from(
    new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))
  );
  const selected = [];

  for (const tag of uniqueTags) {
    const next = [...selected, tag].join(", ");
    if (next.length > maxLength) break;
    selected.push(tag);
  }

  return selected.join(", ");
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
  const cast = completeCast(record);

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

export function generateCoreCardImagePrompt(record) {
  const cast = completeCast(record);
  const prompt = [
    `Create a vertical tarot-style Eidomancer Core Card image for "${cast.title}".`,
    `Core symbolic object: ${cast.coreObject}`,
    `Mood/tone: ${cast.moodTone}`,
    `Visual atmosphere: ${cast.visualAtmosphere}`,
    `Signal: ${cast.signal}`,
    `Tension: ${cast.tension}`,
    `Pattern: ${cast.pattern}`,
    `Echo: ${cast.echo}`,
    cast.guidance ? `Guidance: ${cast.guidance}` : "",
    "Use a 2:3 portrait composition with an ornate tarot-style frame.",
    "Keep important symbols inside safe margins and avoid crowding text zones.",
    "The image should feel like the symbolic seed of the cast, not a full environmental artifact scene.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${cast.title} Core Card Image Prompt`,
    prompt,
    imageFormat: IMAGE_FORMATS.CORE,
    orientation: "tarot vertical",
    intendedUse: IMAGE_FORMATS.CORE.intendedUse,
    recommendedAspectRatio: IMAGE_FORMATS.CORE.aspectRatio,
    suggestedRenderingStyle: "ornate tarot frame, symbolic core-card illustration",
    cardTitle: cast.title,
    coreObject: cast.coreObject,
    moodTone: cast.moodTone,
    visualAtmosphere: cast.visualAtmosphere,
    symbolicElements: {
      signal: cast.signal,
      tension: cast.tension,
      pattern: cast.pattern,
      echo: cast.echo,
      guidance: cast.guidance,
    },
  };
}

export function generateEcho(record) {
  const cast = completeCast(record);

  return {
    title: cast.title,
    concept:
      "A symbolic, meme-capable wide image prompt that compresses the cast into one emotionally sticky visual echo.",
    imageFormat: IMAGE_FORMATS.ECHO,
    orientation: "cinematic 16:9",
    intendedUse: IMAGE_FORMATS.ECHO.intendedUse,
    recommendedAspectRatio: IMAGE_FORMATS.ECHO.aspectRatio,
    suggestedRenderingStyle: "meme-dense cinematic symbolic echo",
    prompt: buildImagePrompt({ cast, type: "ECHO" }),
    shortPhrase: cast.hook,
  };
}

export function generateLyrics(record) {
  const cast = completeCast(record);

  return {
    title: cast.title,
    lyrics: `Verse 1
${cast.signal}

Pre-Chorus
${cast.tension}

Chorus
${buildChorus(cast)}

Verse 2
${cast.pattern}

Bridge
${cast.poem}

Outro
${cast.hook}`,
  };
}

export function generateSuno(record) {
  const cast = completeCast(record);

  return {
    title: cast.title,
    stylePrompt: `Cinematic, emotionally intelligent, future-mystic, symbolic, reflective, grounded but transcendent, with strong melodic payoff and memorable chorus. Theme focus: ${cast.echo}. Emotional basis: ${cast.signal}. Core hook: ${cast.hook}`,
    vocalMood: "Reflective, sincere, vivid, quietly intense",
    hook: cast.hook,
    imageFormat: IMAGE_FORMATS.SUNO,
    coverPrompt: buildImagePrompt({ cast, type: "SUNO" }),
  };
}

export function generateSongPackage(record) {
  const cast = completeCast(record);
  const songTitle = cast.title;
  const sunoStylePrompt = limitText(
    [
      "Cinematic symbolic art-pop with electronic texture, organic percussion, and a memorable melodic chorus.",
      "Mood: reflective, vivid, future-mystic, emotionally grounded, quietly intense.",
      `Theme: ${cast.theme}.`,
      `Emotional basis: ${cast.signal}.`,
      `Core tension: ${cast.tension}.`,
      `Pattern movement: ${cast.pattern}.`,
      `Hook: ${cast.hook}.`,
      "No specific artist or band reference; original style only.",
    ].join(" "),
    1000
  );
  const lyrics = generateLyrics(record).lyrics;

  return {
    songTitle,
    sunoStylePrompt,
    lyrics,
  };
}

export function generateSpecterr(record) {
  const cast = completeCast(record);

  return {
    title: cast.title,
    subtitle: cast.subtitle,
    tagline: cast.hook,
    imageFormat: IMAGE_FORMATS.SPECTERR,
    prompt: buildImagePrompt({ cast, type: "SPECTERR" }),
  };
}

export function generateYouTubePackage(record) {
  const cast = completeCast(record);
  const song = getPackageOutput(record, "song");
  const videoTitle = song?.songTitle
    ? `${song.songTitle} | Eidomancer Song`
    : `${cast.title} | Eidomancer Cast`;

  const tags = [
    "Eidomancer",
    cast.theme,
    song ? "symbolic music" : "symbolic video",
    "symbolic cast",
    "meaning compression",
    "philosophy",
    cast.title,
    song?.songTitle || "",
  ];
  const tagString = limitCommaTags(tags, 500);
  const description = `${videoTitle}

${cast.subtitle}

Question:
${cast.question}

Signal:
${cast.signal}

Tension:
${cast.tension}

Pattern:
${cast.pattern}

Echo:
${cast.echo}${
    song
      ? `

Song Package:
${song.songTitle || cast.title}

${song.sunoStylePrompt || ""}`
      : ""
  }

Generated with Eidomancer.`;

  return {
    videoTitle,
    description,
    tags: tagString,
    titleOptions: [
      videoTitle,
      `${cast.hook} | Eidomancer`,
      `${cast.title} - Signal from ${cast.theme}`,
    ],
    tagList: tags.filter(Boolean),
    tagString,
  };
}

export function generateFullPackage(record) {
  const cast = completeCast(record);
  const youtube = generateYouTubePackage(record);
  const lyrics = generateLyrics(record);
  const suno = generateSuno(record);
  const echo = generateEcho(record);
  const specterr = generateSpecterr(record);
  const coreCard = generateCoreCard(record);
  const coreImagePrompt = generateCoreCardImagePrompt(record);

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
    "GUIDANCE",
    "----------------------------",
    cast.guidance,
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
    youtube.tagString || youtube.tags || "",
    "",
    "----------------------------",
    "CORE CARD IMAGE PROMPT",
    "----------------------------",
    coreImagePrompt.prompt,
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
