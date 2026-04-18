// D:\eidomancer\src\lib\dailyCast.js

import { generateResonance } from "./resonanceEngine";
import { generateCastFromSeed, buildSeed } from "./castEngine";
import { detectEngagementMode, engagementModeProfiles } from "./engagementMode";
import { buildDailyPromptBundle } from "./dailyCastPrompts";

function safeText(value = "") {
  return String(value || "").trim();
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeInput(input) {
  if (typeof input === "string") {
    return {
      question: input,
      sourceText: "",
      userContext: "",
      history: [],
      profile: null,
      date: new Date(),
    };
  }

  return {
    question: input?.question || "",
    sourceText: input?.sourceText || "",
    userContext: input?.userContext || "",
    history: Array.isArray(input?.history) ? input.history : [],
    profile: input?.profile || null,
    date: input?.date instanceof Date ? input.date : new Date(),
  };
}

function summarizeRecentHistory(history = [], limit = 7) {
  if (!Array.isArray(history)) return [];
  return history.filter(Boolean).slice(0, limit);
}

function buildDailySeedText({
  dateKey,
  question,
  recentCasts = [],
  engagementMode,
  profile,
  resonance,
}) {
  const recentTitles = recentCasts
    .slice(0, 3)
    .map((cast) => cast?.coreCard?.title || cast?.title || cast?.coreCard?.name)
    .filter(Boolean)
    .join(" | ");

  const theme =
    profile?.theme ||
    profile?.selectedTheme ||
    profile?.castTheme ||
    "The Emergent Ones";

  return [
    `DATE:${dateKey}`,
    `MODE:${engagementMode || "seeker"}`,
    `THEME:${theme}`,
    question ? `QUESTION:${question}` : "QUESTION:daily reflection",
    recentTitles ? `RECENT:${recentTitles}` : "RECENT:none",
    resonance?.resonance ? `RESONANCE:${resonance.resonance}` : "",
    resonance?.genre ? `GENRE:${resonance.genre}` : "",
    resonance?.signal ? `SIGNAL_CLASS:${resonance.signal}` : "",
    resonance?.pattern ? `PATTERN_CLASS:${resonance.pattern}` : "",
    resonance?.tension ? `TENSION_CLASS:${resonance.tension}` : "",
  ]
    .filter(Boolean)
    .join(" :: ");
}

function buildDailyMetadata({
  dateKey,
  engagementDetection,
  recentCasts = [],
  seedText,
  resonance,
}) {
  return {
    castType: "daily",
    dateKey,
    dailySeed: seedText,
    continuityCount: recentCasts.length,
    engagementMode: engagementDetection?.mode || "seeker",
    engagementConfidence: engagementDetection?.confidence ?? 0.25,
    engagementScores: engagementDetection?.scores || {},
    resonance: resonance?.resonance || null,
    resonanceGenre: resonance?.genre || null,
    resonanceSignal: resonance?.signal || null,
    resonancePattern: resonance?.pattern || null,
    resonanceTension: resonance?.tension || null,
  };
}

function looksLikeSentence(text = "") {
  const value = safeText(text);
  if (!value) return false;
  if (/[.!?]$/.test(value)) return true;

  if (
    /^(this|there|you|your|today|notice|watch|stay|take|growth|emergence|the pattern|the card)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return value.split(" ").length > 8;
}

function buildDailyCoreCardHook(existingHook = "", dateKey = "") {
  const hook = safeText(existingHook);

  if (!hook) {
    return `You have drawn the card that governs ${dateKey || "today"}.`;
  }

  if (/^you have drawn/i.test(hook)) return hook;
  if (looksLikeSentence(hook)) return hook;

  return `You have drawn ${/^the\b/i.test(hook) ? hook : `the ${hook}`}.`;
}

function inferSuggestedCardName({
  question = "",
  sourceText = "",
  userContext = "",
  resonance = null,
}) {
  const source = [question, sourceText, userContext].join(" ").toLowerCase();

  if (/\b(how now brown cow|absurd|playful|nonsense|joke|weird)\b/.test(source)) {
    return "The Trickster Prompt";
  }

  if (/\b(bug|broken|error|glitch|fix|debug|failure|wrong)\b/.test(source)) {
    return "The Fault in the Pattern";
  }

  if (
    /\b(exhausted|tired|burnout|burned out|nothing left|overwhelmed|fatigue)\b/.test(
      source
    )
  ) {
    return "The Exhausted Signal";
  }

  if (/\b(confused|lost|uncertain|adrift|compass|direction)\b/.test(source)) {
    return "The Fading Compass";
  }

  if (/\b(algorithm|market|metrics|performance|value|worth)\b/.test(source)) {
    return "The Measured Self";
  }

  if (resonance?.signal === "absurd") return "The Trickster Prompt";
  if (resonance?.signal === "conflict") return "The Fault in the Pattern";

  return "";
}

function tagCastAsDaily(cast, { dateKey, metadata, seedText, engagement }) {
  if (!cast || typeof cast !== "object") return cast;

  const coreCardName =
    cast?.coreCard?.name || cast?.cardName || cast?.title || "Untitled Cast";

  const tagged = {
    ...cast,
    castType: "daily",
    dateKey,
    title: cast?.title || coreCardName,
    metadata: {
      ...(cast.metadata || {}),
      ...metadata,
    },
    engagement: {
      ...(cast.engagement || {}),
      ...(engagement || {}),
    },
  };

  tagged.coreCard = {
    ...(cast.coreCard || {}),
    name: coreCardName,
    title: cast?.coreCard?.title || coreCardName,
    hook: buildDailyCoreCardHook(cast?.coreCard?.hook, dateKey),
  };

  tagged.shareables = {
    ...(cast.shareables || {}),
    echoCard: {
      ...(cast.shareables?.echoCard || {}),
      body:
        cast.shareables?.echoCard?.body ||
        cast.echo ||
        cast.sections?.find((section) => section?.type === "echo")?.content ||
        "",
    },
  };

  tagged.input = cast.input || seedText;

  return tagged;
}

export function buildDailyPrompt({
  dateKey,
  question = "",
  sourceText = "",
  userContext = "",
  recentCasts = [],
  engagement = null,
  profile = null,
}) {
  return buildDailyPromptBundle({
    dateKey,
    question,
    sourceText,
    userContext,
    recentCasts,
    engagement,
    profile,
  });
}

export async function generateDailyCast(input) {
  const payload = normalizeInput(input);
  const dateKey = getDateKey(payload.date);
  const recentCasts = summarizeRecentHistory(payload.history, 7);

  // Raw user input is the authoritative focus for meaning generation.
  const rawQuestion = safeText(payload.question);
  const rawSourceText = safeText(payload.sourceText);
  const rawUserContext = safeText(payload.userContext);

  const engagementDetection = detectEngagementMode(rawQuestion, recentCasts);

  const engagementProfile =
    engagementModeProfiles[engagementDetection.mode] ||
    engagementModeProfiles.seeker;

  const engagement = {
    mode: engagementDetection.mode,
    confidence: engagementDetection.confidence,
    title: engagementProfile.title,
    tone: engagementProfile.tone,
    emphasis: engagementProfile.emphasis,
    adviceStyle: engagementProfile.adviceStyle,
  };

  // Still build this for future scaffolding, but do not trust it as the primary question source.
  buildDailyPrompt({
    dateKey,
    question: rawQuestion,
    sourceText: rawSourceText,
    userContext: rawUserContext,
    recentCasts,
    engagement,
    profile: payload.profile,
  });

  const resonanceSeed = buildSeed({
    question: rawQuestion,
    transcript: rawSourceText,
    notes: rawUserContext,
  });

  const resonance = generateResonance({
    sections: [
      { type: "question", content: rawQuestion },
      { type: "source", content: rawSourceText },
      { type: "context", content: rawUserContext },
      { type: "gist", content: resonanceSeed.gist || "" },
    ],
  });

  const seedText = buildDailySeedText({
    dateKey,
    question: rawQuestion,
    recentCasts,
    engagementMode: engagement.mode,
    profile: payload.profile,
    resonance,
  });

  const suggestedCardName = inferSuggestedCardName({
    question: rawQuestion,
    sourceText: rawSourceText,
    userContext: rawUserContext,
    resonance,
  });

  const seed = {
    question: rawQuestion,
    sourceText: [
      rawQuestion ? `PRIMARY QUESTION:\n${rawQuestion}` : "",
      rawQuestion ? `FOCUS REPEATED:\n${rawQuestion}` : "",
      rawQuestion ? `USER IS SPECIFICALLY ASKING:\n${rawQuestion}` : "",
      rawQuestion ? `DO NOT IGNORE THIS FOCUS:\n${rawQuestion}` : "",
      seedText,
      rawSourceText ? `SOURCE TEXT:\n${rawSourceText}` : "",
      rawUserContext ? `USER CONTEXT:\n${rawUserContext}` : "",
      resonanceSeed.gist ? `GIST:\n${resonanceSeed.gist}` : "",
      Array.isArray(resonanceSeed.themes) && resonanceSeed.themes.length
        ? `THEMES:\n${resonanceSeed.themes.join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    suggestedCardName,
  };

  const cast = await generateCastFromSeed(seed);

  const metadata = buildDailyMetadata({
    dateKey,
    engagementDetection,
    recentCasts,
    seedText,
    resonance,
  });

  return tagCastAsDaily(cast, {
    dateKey,
    metadata,
    seedText,
    engagement,
  });
}