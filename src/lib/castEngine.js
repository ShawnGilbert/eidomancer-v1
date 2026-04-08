// D:\eidomancer\src\lib\castEngine.js

const USE_LIVE_API = true;

const MAX_INPUT_CHARS = 4000;

const SECTION_ORDER = ["signal", "tension", "pattern", "poem", "echo"];
const VALID_SECTION_TYPES = new Set(SECTION_ORDER);

const SECTION_LABELS = {
  signal: "Signal",
  tension: "Tension",
  pattern: "Pattern",
  poem: "Poem",
  echo: "Echo",
};

// -------------------------
// CLEANING
// -------------------------

function normalizeWhitespace(text = "") {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanInputText(input = "") {
  let text = normalizeWhitespace(input);

  if (text.length > MAX_INPUT_CHARS) {
    text = text.slice(0, MAX_INPUT_CHARS).trim();
  }

  return text;
}

// -------------------------
// PROMPT
// -------------------------

function buildLiveCastPrompt({ question, sourceText, userContext }) {
  return `
You are Eidomancer.

You interpret meaning symbolically.

INPUTS:

QUESTION:
${question || "None provided"}

SOURCE MATERIAL:
${sourceText || "None provided"}

USER CONTEXT:
${userContext || "None provided"}

INSTRUCTIONS:

- Interpret, do NOT summarize
- Ignore timestamps and filler
- Be grounded, not mystical nonsense
- Be emotionally precise
- Echo should be punchy and shareable

RETURN STRICT JSON:

{
  "title": "...",
  "subtitle": "...",
  "coreCard": {
    "title": "...",
    "subtitle": "...",
    "hook": "..."
  },
  "sections": [
    { "type": "signal", "content": "..." },
    { "type": "tension", "content": "..." },
    { "type": "pattern", "content": "..." },
    { "type": "poem", "content": "..." },
    { "type": "echo", "content": "..." }
  ],
  "shareables": {
    "echoCard": {
      "title": "...",
      "body": "...",
      "vibe": "..."
    }
  }
}
`;
}

// -------------------------
// API
// -------------------------

async function callLLM(prompt) {
  const res = await fetch("http://localhost:3001/api/generate", {
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
// PARSE
// -------------------------

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// -------------------------
// 🔥 NORMALIZATION (NEW)
// -------------------------

function normalizeType(type = "") {
  const t = String(type).toLowerCase();

  if (VALID_SECTION_TYPES.has(t)) return t;

  if (t.includes("fail") || t.includes("insight")) return "pattern";
  if (t.includes("advice")) return "tension";
  if (t.includes("summary")) return "signal";
  if (t.includes("emotion")) return "echo";

  return "pattern";
}

// -------------------------
// BUILDERS
// -------------------------

function createSection(type, content) {
  return {
    type,
    label: SECTION_LABELS[type],
    content: content || "",
  };
}

function createCast({
  title,
  subtitle,
  sections,
  input,
  coreCard,
  shareables,
  question,
  sourceText,
  userContext,
}) {
  const map = new Map();

  // 🔥 normalize sections
  for (const s of sections || []) {
    const normalized = normalizeType(s.type);
    map.set(normalized, createSection(normalized, s.content));
  }

  // fill missing
  for (const type of SECTION_ORDER) {
    if (!map.has(type)) {
      map.set(type, createSection(type, ""));
    }
  }

  const finalSections = SECTION_ORDER.map((t) => map.get(t));

  // 🔥 extract echo for list view
  const echoSection = finalSections.find((s) => s.type === "echo");

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    mode: "ai",

    title: title || "Eidomancer Cast",
    subtitle: subtitle || "",

    input,
    question,
    sourceText,
    userContextUsed: userContext,

    coreCard: {
      title: coreCard?.title || title || "Untitled",
      subtitle: coreCard?.subtitle || "",
      hook: coreCard?.hook || "",
    },

    shareables: {
      echoCard: {
        title: shareables?.echoCard?.title || title || "Echo",
        body:
          shareables?.echoCard?.body ||
          echoSection?.content ||
          "",
        vibe: shareables?.echoCard?.vibe || "neutral",
      },
    },

    echo: echoSection?.content || "",

    sections: finalSections,
  };
}

// -------------------------
// NO AI STATE
// -------------------------

function buildNoAIState(input) {
  return {
    id: `noai-${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode: "no-ai",
    title: "AI Connection Required",
    subtitle:
      "Eidomancer requires live AI access to interpret your input.",
    input,
    echo: "",
    sections: [
      createSection("signal", "Eidomancer cannot generate a cast."),
      createSection("tension", "AI layer unavailable."),
      createSection("pattern", "Reconnect required."),
      createSection("poem", "The ritual waits."),
      createSection("echo", "Reconnect."),
    ],
  };
}

// -------------------------
// FORMATTER
// -------------------------

export function formatCastAsText(cast) {
  if (!cast || typeof cast !== "object") return "";

  const lines = [];
  lines.push("🃏 Card Title");
  lines.push(cast.title || "Untitled Cast");

  if (cast.subtitle) {
    lines.push("");
    lines.push(cast.subtitle);
  }

  for (const section of cast.sections || []) {
    lines.push("");
    lines.push(section.label);
    lines.push(section.content);
  }

  return lines.join("\n");
}

// -------------------------
// PIPELINE
// -------------------------

export async function generateCast(input) {
  let payload;

  if (typeof input === "string") {
    payload = { question: input, sourceText: "", userContext: "" };
  } else {
    payload = {
      question: input?.question || "",
      sourceText: input?.sourceText || "",
      userContext: input?.userContext || "",
    };
  }

  const cleanedQuestion = cleanInputText(payload.question);
  const cleanedSource = cleanInputText(payload.sourceText);

  if (!USE_LIVE_API) return buildNoAIState(cleanedQuestion);

  const prompt = buildLiveCastPrompt({
    question: cleanedQuestion,
    sourceText: cleanedSource,
    userContext: payload.userContext,
  });

  try {
    const raw = await callLLM(prompt);
    const parsed = tryParseJSON(raw);

    if (parsed && parsed.sections) {
      return createCast({
        ...parsed,
        input: cleanedQuestion,
        question: cleanedQuestion,
        sourceText: cleanedSource,
        userContext: payload.userContext,
      });
    }

    return buildNoAIState(cleanedQuestion);
  } catch {
    return buildNoAIState(cleanedQuestion);
  }
}