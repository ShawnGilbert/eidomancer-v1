function joinTags(tags) {
  return tags.filter(Boolean).join(", ");
}

export function generateCoreCard(record) {
  return {
    headline: record.title,
    subhead: record.echo,
    sections: {
      signal: record.signal,
      tension: record.tension,
      pattern: record.pattern,
      poem: record.poem,
    },
    footer: `Theme: ${record.theme || "The Emergent Ones"}`,
  };
}

export function generateEcho(record) {
  return {
    title: record.title,
    concept:
      "A symbolic, meme-capable image prompt that compresses the cast into one emotionally sticky visual.",
    prompt: `Create an Eidomancer Echo image for "${record.title}" under The Emergent Ones theme. Center the image on this emotional compression: ${record.echo} Visualize this pattern: ${record.pattern} Include the emotional tone of this signal: ${record.signal} The style should feel cinematic, mystical, futuristic, symbolic, and socially shareable.`,
  };
}

export function generateLyrics(record) {
  return {
    title: record.title,
    lyrics: `Verse 1
${record.signal}

Pre-Chorus
${record.tension}

Chorus
${record.echo}

Verse 2
${record.pattern}

Bridge
${record.poem}

Outro
${record.echo}`,
  };
}

export function generateSuno(record) {
  return {
    title: record.title,
    stylePrompt: `Cinematic, emotionally intelligent, future-mystic, symbolic, reflective, grounded but transcendent, with strong melodic payoff and memorable chorus. Theme focus: ${record.echo}. Emotional basis: ${record.signal}`,
    vocalMood: "Reflective, sincere, vivid, quietly intense",
    hook: record.echo,
  };
}

export function generateYouTubePackage(record) {
  const tags = [
    "Eidomancer",
    "The Emergent Ones",
    "AI music",
    "symbolic cast",
    "meaning compression",
    "philosophy",
    record.title,
  ];

  return {
    titleOptions: [
      `${record.title} | Eidomancer Cast`,
      `${record.echo} | Eidomancer`,
      `${record.title} - Signal from The Emergent Ones`,
    ],
    description: `${record.title}

Question: ${record.question}

Signal
${record.signal}

Tension
${record.tension}

Pattern
${record.pattern}

Poem
${record.poem}

Echo
${record.echo}`,
    tags,
    tagString: joinTags(tags),
  };
}

export function generateFullPackage(record) {
  const youtube = generateYouTubePackage(record);
  const lyrics = generateLyrics(record);
  const suno = generateSuno(record);

  const bundle = [
    "============================",
    "EIDOMANCER FULL PACKAGE",
    "============================",
    "",
    "TITLE:",
    record.title,
    "",
    "HOOK:",
    record.echo,
    "",
    "----------------------------",
    "QUESTION",
    "----------------------------",
    record.question,
    "",
    "----------------------------",
    "SIGNAL",
    "----------------------------",
    record.signal,
    "",
    "----------------------------",
    "TENSION",
    "----------------------------",
    record.tension,
    "",
    "----------------------------",
    "PATTERN",
    "----------------------------",
    record.pattern,
    "",
    "----------------------------",
    "POEM",
    "----------------------------",
    record.poem,
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
    title: record.title,
    bundle,
  };
}