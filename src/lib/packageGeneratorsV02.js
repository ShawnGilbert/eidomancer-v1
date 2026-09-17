const IMAGE_FORMATS_V02 = Object.freeze({
  core_card: Object.freeze({
    aspect_ratio: "2:3",
    intended_use: "authoritative Core Card image",
  }),
  echo: Object.freeze({
    aspect_ratio: "16:9",
    intended_use: "wide symbolic Echo image",
  }),
});

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sectionMap(record = {}) {
  const map = {};
  for (const section of Array.isArray(record.sections) ? record.sections : []) {
    const type = text(section?.type || section?.id).toLowerCase();
    const content = text(section?.content || section?.full || section?.short);
    if (type && content) map[type] = content;
  }
  return map;
}

export function normalizePackageRecordV02(record = {}, presentation = {}) {
  const sections = sectionMap(record);
  const card = record.core_card || record.coreCard || {};
  const essence = text(sections.essence || record.essence);
  const echo = text(record.echo || sections.echo);
  const guidance = text(
    sections.guidance || sections.recommendation || record.guidance || record.recommendation
  );
  const hook = text(record.hook || card.hook);
  const symbolicObject = text(
    card.symbolic_object || card.symbolicObject || record.symbolic_object ||
      record.symbolicObject || essence
  );

  return {
    title: text(card.name || card.title || record.title || record.cardName, "Untitled Cast"),
    question: text(record.question || record.input),
    signal: text(sections.signal || record.signal),
    tension: text(sections.tension || record.tension),
    pattern: text(sections.pattern || record.pattern),
    insight: text(sections.insight || record.insight),
    essence,
    guidance,
    echo,
    hook,
    core_card: {
      name: text(card.name || card.title || record.title || record.cardName),
      description: text(card.description),
      symbolic_object: symbolicObject,
      image_prompt: text(card.image_prompt || card.imagePrompt),
    },
    presentation: {
      theme: text(presentation.theme, "eidomancer-default"),
      voice: text(presentation.voice),
      imagery: Array.isArray(presentation.imagery) ? presentation.imagery : [],
      metaphor: Array.isArray(presentation.metaphor) ? presentation.metaphor : [],
      visual_language: Array.isArray(presentation.visual_language)
        ? presentation.visual_language
        : [],
      tone: text(presentation.tone),
    },
  };
}

function presentationInstruction(presentation = {}) {
  const parts = [
    presentation.theme ? `Theme: ${presentation.theme}.` : "",
    presentation.voice ? `Voice: ${presentation.voice}.` : "",
    presentation.visual_language?.length
      ? `Visual language: ${presentation.visual_language.join(", ")}.`
      : "",
    presentation.imagery?.length
      ? `Compatible imagery: ${presentation.imagery.join(", ")}.`
      : "",
    presentation.metaphor?.length
      ? `Compatible metaphor treatment: ${presentation.metaphor.join(", ")}.`
      : "",
  ].filter(Boolean);
  return parts.join(" ");
}

export function generateCoreCardImagePromptV02(record, presentation = {}) {
  const cast = normalizePackageRecordV02(record, presentation);
  return {
    title: `${cast.core_card.name || cast.title} Core Card Image Prompt`,
    card_name: cast.core_card.name,
    description: cast.core_card.description,
    symbolic_object: cast.core_card.symbolic_object,
    prompt: cast.core_card.image_prompt,
    prompt_authority: "core_cast.core_card.image_prompt",
    presentation: cast.presentation,
    image_format: IMAGE_FORMATS_V02.core_card,
  };
}

export function generateEchoImagePromptV02(record, presentation = {}) {
  const cast = normalizePackageRecordV02(record, presentation);
  const style = presentationInstruction(cast.presentation);
  const prompt = [
    `Create a wide 16:9 Echo image for "${cast.title}".`,
    `Authoritative symbolic object: ${cast.core_card.symbolic_object}`,
    `Authoritative Core Card meaning: ${cast.core_card.description}`,
    `Essence: ${cast.essence}`,
    `Echo: ${cast.echo}`,
    style,
    "Preserve the same symbolic concept selected by the Core Cast.",
    "Do not substitute a competing archetype, object, setting, or metaphor.",
    "Do not render the words Signal, Tension, Pattern, Insight, Essence, Guidance, or Echo.",
    "If text is used, use only the exact Echo line.",
  ].filter(Boolean).join(" ");

  return {
    title: cast.title,
    symbolic_object: cast.core_card.symbolic_object,
    essence: cast.essence,
    echo: cast.echo,
    hook: cast.hook,
    prompt,
    presentation: cast.presentation,
    image_format: IMAGE_FORMATS_V02.echo,
  };
}

export function generateImagePromptsV02(record, presentation = {}) {
  return {
    core_card: generateCoreCardImagePromptV02(record, presentation),
    echo: generateEchoImagePromptV02(record, presentation),
  };
}

export function generateSongPackageV02(record, presentation = {}) {
  const cast = normalizePackageRecordV02(record, presentation);
  const styleParts = [
    `Theme: ${cast.presentation.theme}.`,
    cast.presentation.voice ? `Voice: ${cast.presentation.voice}.` : "",
    cast.presentation.tone ? `Tone: ${cast.presentation.tone}.` : "",
    `Preserve the symbolic object: ${cast.core_card.symbolic_object}.`,
    "Do not introduce a competing central metaphor.",
  ].filter(Boolean);

  return {
    song_title: cast.title,
    hook: cast.hook,
    echo: cast.echo,
    essence: cast.essence,
    guidance: cast.guidance,
    style_prompt: styleParts.join(" "),
    lyrics: [
      "[Verse 1 — Signal]", cast.signal,
      "", "[Pre-Chorus — Tension]", cast.tension,
      "", "[Chorus — Echo]", cast.echo,
      "", "[Verse 2 — Pattern]", cast.pattern,
      "", "[Bridge — Insight]", cast.insight,
      "", "[Break — Essence]", cast.essence,
      "", "[Coda — Guidance]", cast.guidance,
      cast.hook ? `\n[Optional Hook]\n${cast.hook}` : "",
    ].filter((line) => line !== "").join("\n"),
  };
}

export function generateYouTubePackageV02(record, presentation = {}) {
  const cast = normalizePackageRecordV02(record, presentation);
  const description = [
    `${cast.title} | Eidomancer Artifact`,
    "",
    cast.core_card.description,
    "",
    "Signal:", cast.signal,
    "", "Tension:", cast.tension,
    "", "Pattern:", cast.pattern,
    "", "Insight:", cast.insight,
    "", "Essence:", cast.essence,
    "", "Guidance:", cast.guidance,
    "", "Echo:", cast.echo,
  ].join("\n");

  return {
    video_title: `${cast.title} | Eidomancer Artifact`,
    description,
    hook: cast.hook,
    echo: cast.echo,
    symbolic_object: cast.core_card.symbolic_object,
    tags: [
      "Eidomancer",
      "symbolic artifact",
      "philosophy",
      cast.title,
      cast.presentation.theme,
    ].filter(Boolean),
  };
}

export function generateFullPackageV02(record, presentation = {}) {
  const cast = normalizePackageRecordV02(record, presentation);
  const images = generateImagePromptsV02(record, presentation);
  const song = generateSongPackageV02(record, presentation);
  const youtube = generateYouTubePackageV02(record, presentation);

  return {
    title: cast.title,
    core_cast_semantics: {
      signal: cast.signal,
      tension: cast.tension,
      pattern: cast.pattern,
      insight: cast.insight,
      essence: cast.essence,
      guidance: cast.guidance,
      echo: cast.echo,
      hook: cast.hook,
    },
    core_card: cast.core_card,
    presentation: cast.presentation,
    image_prompts: images,
    song_package: song,
    youtube_package: youtube,
  };
}
