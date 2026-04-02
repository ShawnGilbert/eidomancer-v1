function joinTags(tags) {
  return tags.filter(Boolean).join(", ");
}

export function generateCoreCard(record) {
  return {
    headline: record.cast.title,
    subhead: record.cast.echo,
    sections: {
      pattern: record.cast.pattern,
      tension: record.cast.tension,
      insight: record.cast.insight,
      advice: record.cast.advice,
    },
    footer: `Theme: ${record.theme}`,
  };
}

export function generateEcho(record) {
  return {
    title: record.cast.title,
    concept:
      "A symbolic, meme-capable image prompt that compresses the cast into one emotionally sticky visual.",
    prompt: `Create an Eidomancer Echo image for "${record.cast.title}" under The Emergent Ones theme. Center the image on this emotional compression: ${record.cast.echo} Visualize this pattern: ${record.cast.pattern} The style should feel cinematic, mystical, futuristic, symbolic, and socially shareable.`,
  };
}

export function generateLyrics(record) {
  return {
    title: record.cast.title,
    lyrics: `Verse 1\n${record.cast.pattern}\n\nPre-Chorus\n${record.cast.tension}\n\nChorus\n${record.cast.echo}\n${record.cast.insight}\n\nVerse 2\nThe signal keeps returning through another door\nThe shape looks familiar but it is not before\n\nBridge\n${record.cast.advice}\n\nOutro\n${record.cast.echo}`,
  };
}

export function generateSuno(record) {
  return {
    title: record.cast.title,
    stylePrompt: `Cinematic, emotionally intelligent, future-mystic, symbolic, reflective, grounded but transcendent, with strong melodic payoff and memorable chorus. Theme focus: ${record.cast.echo}`,
    vocalMood: "Reflective, sincere, vivid, quietly intense",
    hook: record.cast.echo,
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
    record.cast.title,
  ];

  return {
    titleOptions: [
      `${record.cast.title} | Eidomancer Cast`,
      `${record.cast.echo} | Eidomancer`,
      `${record.cast.title} - Signal from The Emergent Ones`,
    ],
    description: `${record.cast.title}\n\nQuestion: ${record.input.question}\n\nPattern\n${record.cast.pattern}\n\nTension\n${record.cast.tension}\n\nInsight\n${record.cast.insight}\n\nAdvice\n${record.cast.advice}\n\nEcho\n${record.cast.echo}`,
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
    record.cast.title,
    "",
    "HOOK:",
    record.cast.echo,
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
    title: record.cast.title,
    bundle,
  };
}