// D:\eidomancer\src\lib\dailyCast.js

import { generateCast } from "./castEngine";
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
}) {
  const recentTitles = recentCasts
    .slice(0, 3)
    .map((cast) => cast?.coreCard?.title || cast?.title)
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
  ].join(" :: ");
}

function buildDailyMetadata({
  dateKey,
  engagementDetection,
  recentCasts = [],
  seedText,
}) {
  return {
    castType: "daily",
    dateKey,
    dailySeed: seedText,
    continuityCount: recentCasts.length,
    engagementMode: engagementDetection?.mode || "seeker",
    engagementConfidence: engagementDetection?.confidence ?? 0.25,
    engagementScores: engagementDetection?.scores || {},
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

  if (value.split(" ").length > 8) return true;

  return false;
}

function buildDailyCoreCardHook(existingHook = "", dateKey = "") {
  const hook = safeText(existingHook);

  if (!hook) {
    return `You have drawn the card that governs ${dateKey || "today"}.`;
  }

  if (/^you have drawn/i.test(hook)) {
    return hook;
  }

  if (looksLikeSentence(hook)) {
    return hook;
  }

  return `You have drawn ${/^the\b/i.test(hook) ? hook : `the ${hook}`}.`;
}

function tagCastAsDaily(cast, { dateKey, metadata, seedText }) {
  if (!cast || typeof cast !== "object") return cast;

  const tagged = {
    ...cast,
    castType: "daily",
    dateKey,
    metadata: {
      ...(cast.metadata || {}),
      ...metadata,
    },
  };

  tagged.coreCard = {
    ...(cast.coreCard || {}),
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

  const engagementDetection = detectEngagementMode(
    payload.question,
    recentCasts
  );

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

  const promptBundle = buildDailyPrompt({
    dateKey,
    question: payload.question,
    sourceText: payload.sourceText,
    userContext: payload.userContext,
    recentCasts,
    engagement,
    profile: payload.profile,
  });

  const seedText = buildDailySeedText({
    dateKey,
    question: payload.question,
    recentCasts,
    engagementMode: engagement.mode,
    profile: payload.profile,
  });

  const cast = await generateCast({
    question: promptBundle.question,
    sourceText: promptBundle.sourceText,
    userContext: promptBundle.userContext,
    history: recentCasts,
  });

  const metadata = buildDailyMetadata({
    dateKey,
    engagementDetection,
    recentCasts,
    seedText,
  });

  return tagCastAsDaily(cast, {
    dateKey,
    metadata,
    seedText,
  });
}