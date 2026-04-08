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
  };
}

export function generateEcho(record) {
  const cast = flattenRecord(record);

  return {
    title: cast.title,
    concept:
      "A symbolic, meme-capable image prompt that compresses the cast into one emotionally sticky visual.",
    prompt: `Create an Eidomancer Echo image for "${cast.title}" under ${cast.theme} theme. Center the image on this emotional compression: ${cast.echo} Visualize this pattern: ${cast.pattern} Include the emotional tone of this signal: ${cast.signal} The style should feel cinematic, mystical, futuristic, symbolic, and socially shareable.`,
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
    "SUNO STYLE PROMPT",
    "----------------------------",
    suno.stylePrompt,
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