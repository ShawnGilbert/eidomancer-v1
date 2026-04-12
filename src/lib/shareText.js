// D:\eidomancer\src\lib\shareText.js

function safeText(value = "") {
  return String(value || "").trim();
}

function compactWhitespace(value = "") {
  return safeText(value).replace(/\s+/g, " ");
}

function truncateText(value = "", max = 220) {
  const text = compactWhitespace(value);

  if (!text) return "";
  if (text.length <= max) return text;

  return `${text.slice(0, max).trim()}…`;
}

function getSectionContent(cast, type) {
  if (!cast || !Array.isArray(cast.sections)) return "";

  const match = cast.sections.find((section) => section?.type === type);
  return safeText(match?.content);
}

function getCoreTitle(cast) {
  return (
    safeText(cast?.coreCard?.title) ||
    safeText(cast?.title) ||
    "Untitled Card"
  );
}

function getCoreHook(cast) {
  return safeText(cast?.coreCard?.hook);
}

function getEcho(cast) {
  return (
    safeText(cast?.echo) ||
    safeText(cast?.shareables?.echoCard?.body) ||
    getSectionContent(cast, "echo")
  );
}

function getSignal(cast) {
  return getSectionContent(cast, "signal");
}

function getPattern(cast) {
  return getSectionContent(cast, "pattern");
}

function getTension(cast) {
  return getSectionContent(cast, "tension");
}

function getDateLabel(cast) {
  return safeText(cast?.dateKey);
}

function getHashtagBlock() {
  return "#Eidomancer";
}

export function buildShortShareText(cast) {
  if (!cast || typeof cast !== "object") return "";

  const title = getCoreTitle(cast);
  const echo = truncateText(getEcho(cast), 180);
  const signal = truncateText(getSignal(cast), 140);
  const pattern = truncateText(getPattern(cast), 140);

  const lines = [`You have drawn the ${title}.`, ""];

  if (signal) {
    lines.push(`Signal: ${signal}`);
  }

  if (pattern) {
    lines.push(`Pattern: ${pattern}`);
  }

  if (echo) {
    lines.push(`Echo: ${echo}`);
  }

  lines.push("");
  lines.push(getHashtagBlock());

  return lines.join("\n").trim();
}

export function buildShareText(cast) {
  if (!cast || typeof cast !== "object") return "";

  const title = getCoreTitle(cast);
  const hook = truncateText(getCoreHook(cast), 220);
  const signal = truncateText(getSignal(cast), 240);
  const tension = truncateText(getTension(cast), 220);
  const pattern = truncateText(getPattern(cast), 240);
  const echo = truncateText(getEcho(cast), 180);
  const dateLabel = getDateLabel(cast);

  const lines = [`You have drawn the ${title}.`];

  if (dateLabel) {
    lines.push(`Date: ${dateLabel}`);
  }

  lines.push("");

  if (hook) {
    lines.push(hook);
    lines.push("");
  }

  if (signal) {
    lines.push(`Signal: ${signal}`);
  }

  if (tension) {
    lines.push(`Tension: ${tension}`);
  }

  if (pattern) {
    lines.push(`Pattern: ${pattern}`);
  }

  if (echo) {
    lines.push("");
    lines.push(`Echo: ${echo}`);
  }

  lines.push("");
  lines.push(getHashtagBlock());

  return lines.join("\n").trim();
}

export function buildClipboardPayload(cast) {
  const shortText = buildShortShareText(cast);
  const fullText = buildShareText(cast);

  return {
    shortText,
    fullText,
    preferredText: shortText || fullText,
  };
}