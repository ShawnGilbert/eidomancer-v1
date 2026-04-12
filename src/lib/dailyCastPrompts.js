// D:\eidomancer\src\lib\dailyCastPrompts.js

function safeText(value = "") {
  return String(value || "").trim();
}

function truncateText(value = "", max = 280) {
  const text = safeText(value);

  if (!text) return "";
  if (text.length <= max) return text;

  return `${text.slice(0, max).trim()}…`;
}

function compactWhitespace(value = "") {
  return safeText(value).replace(/\s+/g, " ");
}

function extractSectionContent(cast, type) {
  if (!cast || !Array.isArray(cast.sections)) return "";

  const match = cast.sections.find((section) => section?.type === type);
  return safeText(match?.content);
}

function summarizeCast(cast = {}) {
  if (!cast || typeof cast !== "object") return null;

  const title = safeText(cast.title || cast.coreCard?.title || "Untitled Cast");
  const subtitle = safeText(cast.subtitle || cast.coreCard?.subtitle);
  const hook = safeText(cast.coreCard?.hook);
  const echo = safeText(cast.echo || extractSectionContent(cast, "echo"));
  const signal = safeText(extractSectionContent(cast, "signal"));
  const pattern = safeText(extractSectionContent(cast, "pattern"));
  const tension = safeText(extractSectionContent(cast, "tension"));
  const dateKey =
    safeText(cast.dateKey) ||
    safeText(cast.createdAt ? String(cast.createdAt).slice(0, 10) : "");

  return {
    dateKey,
    title,
    subtitle,
    hook: truncateText(compactWhitespace(hook), 180),
    signal: truncateText(compactWhitespace(signal), 180),
    tension: truncateText(compactWhitespace(tension), 180),
    pattern: truncateText(compactWhitespace(pattern), 180),
    echo: truncateText(compactWhitespace(echo), 160),
  };
}

function formatRecentCastSummary(cast, index) {
  const summary = summarizeCast(cast);
  if (!summary) return "";

  const parts = [];
  parts.push(`${index + 1}. ${summary.dateKey || "Unknown Date"} — ${summary.title}`);

  if (summary.subtitle) {
    parts.push(`   Subtitle: ${summary.subtitle}`);
  }

  if (summary.hook) {
    parts.push(`   Core Hook: ${summary.hook}`);
  }

  if (summary.signal) {
    parts.push(`   Signal: ${summary.signal}`);
  }

  if (summary.pattern) {
    parts.push(`   Pattern: ${summary.pattern}`);
  }

  if (summary.tension) {
    parts.push(`   Tension: ${summary.tension}`);
  }

  if (summary.echo) {
    parts.push(`   Echo: ${summary.echo}`);
  }

  return parts.join("\n");
}

export function buildRecentCastsSummary(recentCasts = [], limit = 5) {
  if (!Array.isArray(recentCasts) || recentCasts.length === 0) {
    return "No recent casts available.";
  }

  return recentCasts
    .slice(0, limit)
    .map((cast, index) => formatRecentCastSummary(cast, index))
    .filter(Boolean)
    .join("\n\n");
}

export function buildDailyContextBlock({
  dateKey,
  recentCasts = [],
  engagement = null,
  profile = null,
} = {}) {
  const lines = [];

  lines.push(`DATE KEY: ${safeText(dateKey) || "Unknown Date"}`);

  if (engagement?.mode) {
    lines.push(`ENGAGEMENT MODE: ${safeText(engagement.mode)}`);
  }

  if (engagement?.title) {
    lines.push(`ENGAGEMENT TITLE: ${safeText(engagement.title)}`);
  }

  if (engagement?.tone) {
    lines.push(`COMMUNICATION TONE: ${safeText(engagement.tone)}`);
  }

  if (engagement?.emphasis) {
    lines.push(`EMPHASIS: ${safeText(engagement.emphasis)}`);
  }

  if (profile && typeof profile === "object") {
    const theme =
      safeText(profile.theme) ||
      safeText(profile.selectedTheme) ||
      safeText(profile.castTheme);

    const displayName =
      safeText(profile.displayName) ||
      safeText(profile.name) ||
      safeText(profile.casterName);

    const mood =
      safeText(profile.mood) ||
      safeText(profile.currentMood) ||
      safeText(profile.seasonalMood);

    if (displayName) {
      lines.push(`CASTER NAME: ${displayName}`);
    }

    if (theme) {
      lines.push(`CASTER THEME: ${theme}`);
    }

    if (mood) {
      lines.push(`CURRENT MOOD SIGNAL: ${mood}`);
    }
  }

  lines.push("");
  lines.push("RECENT CAST CONTINUITY:");
  lines.push(buildRecentCastsSummary(recentCasts, 5));

  return lines.join("\n").trim();
}

export function buildDailyQuestionWrapper(question = "", dateKey = "") {
  const cleanedQuestion = safeText(question);

  if (!cleanedQuestion) {
    return [
      `This is the daily Eidomancer cast for ${safeText(dateKey) || "today"}.`,
      "Generate a meaningful daily reading grounded in continuity, mood, and pattern.",
      "The cast should feel like today's card, not a random replacement.",
      "Each section must be specific, concrete, emotionally coherent, and internally consistent.",
      "Signal, Tension, Pattern, Echo, and Poem should each do different work instead of repeating the same wording.",
      "The cast must not assume failure as the only valid interpretation.",
      "Where misalignment is identified, also identify what may still be functioning or partially effective.",
      "Do not present the system as broken—present it as behaving according to its current structure.",
      "Balance critique with recognition of what the system is already doing correctly, even if insufficient."
    ].join(" ");
  }

  return [
    `This is the daily Eidomancer cast for ${safeText(dateKey) || "today"}.`,
    `The user's active focus for today is: ${cleanedQuestion}`,

    "This focus is the central interpretive anchor for the entire cast.",
    "Do not generalize. Do not soften the message unnecessarily.",
    "Do not give generic encouragement.",
    "Do not conclude that the user should stop, quit, or abandon anything.",
    "Do not resolve the question. Keep multiple interpretations alive.",
    "The cast should reveal structure, not deliver a final verdict.",
    "The emotional tone should reflect the question, but not amplify its most negative assumption.",
    "If the question is self-critical, introduce structural perspective without reinforcing self-judgment.",

    "The cast should reveal where the structure can shift, not just where it is failing.",
    "Balance exposure of failure with identification of leverage points or constraints that can be changed.",
    "The cast must not assume failure as the only valid interpretation.",
    "Where misalignment is identified, also identify what may still be functioning or partially effective.",
    "Do not present the system as broken—present it as behaving according to its current structure.",
    "Balance critique with recognition of what the system is already doing correctly, even if insufficient.",
    "Each section should express one clear insight, not multiple layered explanations.",
"Prefer shorter, decisive statements over extended reasoning.",
"Avoid stacking multiple clauses in a single sentence.",
"If a sentence can be cut in half without losing meaning, do it.",
"Clarity is more important than completeness.",

    "Every section must respond directly to this focus.",
    "Assume the user is already aware something is off—name it clearly.",

    "Signal must describe what is actually happening beneath the surface.",
    "Tension must describe the real friction, contradiction, or cost the user is experiencing.",
    "Pattern must explain the repeating structure that keeps producing this situation.",
    "Echo must compress the truth into a memorable line that feels slightly uncomfortable but accurate.",
    "Poem must reinforce the same reality symbolically, not drift into abstraction.",

    "Avoid vague language.",
    "Avoid neutral phrasing.",
    "Prefer specificity over comfort.",
    "If a statement feels slightly uncomfortable but true, keep it.",

    "The cast should feel like a mirror that does not distort, not a voice that reassures."
  ].join(" ");
}

export function buildDailySourceTextBlock(sourceText = "") {
  const cleaned = safeText(sourceText);

  if (!cleaned) {
    return "No additional source material was provided for today's daily cast.";
  }

  return cleaned;
}

export function buildDailyUserContextBlock(userContext = "", profile = null) {
  const blocks = [];
  const cleanedUserContext = safeText(userContext);

  if (cleanedUserContext) {
    blocks.push(cleanedUserContext);
  }

  if (profile && typeof profile === "object") {
    const additions = [];

    if (profile.theme || profile.selectedTheme || profile.castTheme) {
      additions.push(
        `Preferred theme: ${
          safeText(profile.theme) ||
          safeText(profile.selectedTheme) ||
          safeText(profile.castTheme)
        }`
      );
    }

    if (profile.communicationStyle) {
      additions.push(
        `Preferred communication style: ${safeText(profile.communicationStyle)}`
      );
    }

    if (profile.currentMood || profile.mood) {
      additions.push(
        `Current mood: ${safeText(profile.currentMood) || safeText(profile.mood)}`
      );
    }

    if (profile.focusArea) {
      additions.push(`Current focus area: ${safeText(profile.focusArea)}`);
    }

    if (additions.length > 0) {
      blocks.push(additions.join("\n"));
    }
  }

  if (blocks.length === 0) {
    return "No additional user context was provided.";
  }

  return blocks.join("\n\n");
}

export function buildDailyPromptBundle({
  dateKey,
  question = "",
  sourceText = "",
  userContext = "",
  recentCasts = [],
  engagement = null,
  profile = null,
} = {}) {
  return {
    question: buildDailyQuestionWrapper(question, dateKey),
    sourceText: buildDailySourceTextBlock(sourceText),
    userContext: [
      buildDailyUserContextBlock(userContext, profile),
      "",
      buildDailyContextBlock({
        dateKey,
        recentCasts,
        engagement,
        profile,
      }),
    ]
      .join("\n")
      .trim(),
  };
}