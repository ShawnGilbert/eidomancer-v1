// D:\eidomancer\src\lib\castEngine.js

const USE_LIVE_API = false;
const MAX_INPUT_CHARS = 4000;
const MAX_FALLBACK_SNIPPET_CHARS = 600;

// -------------------------
// CLEANING
// -------------------------

function normalizeWhitespace(text = "") {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripTimestamps(text = "") {
  return text.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "");
}

function stripUiNoise(text = "") {
  const lines = text.split("\n");

  return lines
    .filter((line) => {
      const t = line.trim().toLowerCase();
      if (!t) return true;

      if (
        t === "transcript" ||
        t === "show transcript" ||
        t === "description" ||
        t === "comments"
      )
        return false;

      if (/^@\w+/.test(t)) return false;
      if (/^https?:\/\//.test(t)) return false;

      return true;
    })
    .join("\n");
}

function looksLikeTranscript(text = "") {
  if (text.length > 1500) return true;

  const lines = text.split("\n").filter(Boolean);
  return lines.length > 10;
}

function cleanInputText(input = "") {
  let text = normalizeWhitespace(input);
  const transcriptLike = looksLikeTranscript(text);

  if (transcriptLike) {
    text = stripTimestamps(text);
    text = stripUiNoise(text);
    text = normalizeWhitespace(text);
  }

  if (text.length > MAX_INPUT_CHARS) {
    text = text.slice(0, MAX_INPUT_CHARS);
  }

  return { cleaned: text, transcriptLike };
}

function shortSnippet(text = "") {
  if (text.length < MAX_FALLBACK_SNIPPET_CHARS) return text;
  return text.slice(0, MAX_FALLBACK_SNIPPET_CHARS) + "...";
}

// -------------------------
// FALLBACK SEED
// -------------------------

function buildFallbackSeed(input = "") {
  const { cleaned, transcriptLike } = cleanInputText(input);
  const snippet = shortSnippet(cleaned);

  return [
    "Gist",
    transcriptLike
      ? `Transcript detected. Compressed source: ${snippet}`
      : `The input centers on: ${snippet}`,
    "",
    "Core Tension",
    transcriptLike
      ? "A large signal is buried under excess structure."
      : "Movement exists but is disrupted by hesitation.",
  ].join("\n");
}

// -------------------------
// FALLBACK CAST (UPGRADED POETRY)
// -------------------------

function buildFallbackCastFromSeed(seed = "") {
  const transcriptMode = seed.toLowerCase().includes("transcript");

  if (transcriptMode) {
    return [
      "🃏 Card Title",
      "The Signal Beneath Density",
      "",
      "Signal",
      "You are facing something large, but most of it is not the point.",
      "",
      "Tension",
      "Volume creates the illusion of importance.",
      "",
      "Pattern",
      "The truth is smaller than the structure around it.",
      "",
      "🧠 Poem",
      [
        "Too many words",
        "stacked like walls.",
        "",
        "Too many lines",
        "asking to matter.",
        "",
        "But something remains",
        "when the rest is stripped away.",
        "",
        "A signal.",
        "",
        "Quiet.",
        "Persistent.",
      ].join("\n"),
      "",
      "⚡ Echo",
      "The signal survives the noise.",
    ].join("\n");
  }

  return [
    "🃏 Card Title",
    "The Friction Beneath Motion",
    "",
    "Signal",
    "You are already moving, but something keeps interrupting you.",
    "",
    "Tension",
    "You want progress, but also certainty.",
    "",
    "Pattern",
    "Too many paths are competing for the same step.",
    "",
    "🧠 Poem",
    [
      "You are not still.",
      "",
      "You are splitting.",
      "",
      "Momentum",
      "trying to exist",
      "in too many directions.",
      "",
      "Choose one.",
      "",
      "Let the rest fall silent.",
    ].join("\n"),
      "",
      "⚡ Echo",
      "Movement begins when choice commits.",
    ].join("\n");
}

// -------------------------
// API (SAFE)
// -------------------------

async function callLLM(prompt) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const text = await res.text();

  if (!res.ok) throw new Error("LLM failed");

  try {
    const data = JSON.parse(text);
    return data.text || data.output || data.result || "";
  } catch {
    return text;
  }
}

// -------------------------
// PIPELINE
// -------------------------

export async function buildSeed(input) {
  const { cleaned } = cleanInputText(input);

  if (!USE_LIVE_API) {
    return buildFallbackSeed(cleaned);
  }

  return await callLLM(cleaned);
}

export async function generateCastFromSeed(seed) {
  if (!USE_LIVE_API) {
    return buildFallbackCastFromSeed(seed);
  }

  return await callLLM(seed);
}

export async function generateCast(input) {
  const seed = await buildSeed(input);
  const cast = await generateCastFromSeed(seed);
  return cast;
}