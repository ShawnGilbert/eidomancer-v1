// D:\eidomancer\src\lib\castEngine.js

import {
  detectEngagementMode,
  engagementModeProfiles,
} from "./engagementMode";

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
// ENGAGEMENT
// -------------------------

function buildEngagementOverlay(engagementProfile, detection) {
  if (!engagementProfile || !detection) return null;

  return {
    mode: detection.mode,
    confidence: detection.confidence,
    title: engagementProfile.title,
    tone: engagementProfile.tone,
    emphasis: engagementProfile.emphasis,
    adviceStyle: engagementProfile.adviceStyle,
  };
}

function prependIfMissing(text = "", prefix = "") {
  const content = String(text || "").trim();
  const lead = String(prefix || "").trim();

  if (!content || !lead) return content;

  const normalizedContent = content.toLowerCase();
  const normalizedLead = lead.toLowerCase();

  if (normalizedContent.startsWith(normalizedLead)) {
    return content;
  }

  return `${lead} ${content}`.trim();
}

function buildSectionPrefix(type, profile) {
  const tone = profile?.tone || "guiding";

  const prefixMap = {
    signal: {
      grounding: "What is surfacing now:",
      guiding: "What this reveals now:",
      challenging: "What this exposes now:",
      reflective: "What is becoming visible:",
    },
    tension: {
      grounding: "Where the friction lives:",
      guiding: "Where the strain is gathering:",
      challenging: "Where the conflict sharpens:",
      reflective: "Where the pressure concentrates:",
    },
    pattern: {
      grounding: "The pattern underneath it:",
      guiding: "The recurring structure beneath it:",
      challenging: "The deeper pattern driving it:",
      reflective: "The wider structure taking shape:",
    },
    echo: {
      grounding: "Hold this line:",
      guiding: "Let this linger:",
      challenging: "Carry this forward:",
      reflective: "Remember this:",
    },
  };

  return prefixMap[type]?.[tone] || "";
}

function adaptRecommendationsInText(text = "", profile) {
  if (!text || !profile) return text;

  const lines = String(text)
    .split("\n")
    .map((line) => line.trimEnd());

  const openerMap = {
    gentle_friction: "Before acting, ",
    encouraging_direction: "To clarify this, ",
    active_testing: "To pressure-test this, ",
    meta_awareness: "To observe the deeper pattern, ",
  };

  const opener = openerMap[profile.adviceStyle] || "";

  return lines
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("• ") ||
        /^\d+\.\s/.test(trimmed)
      ) {
        if (trimmed.startsWith("- ")) {
          return `- ${opener}${trimmed.slice(2)}`;
        }

        if (trimmed.startsWith("• ")) {
          return `• ${opener}${trimmed.slice(2)}`;
        }

        const match = trimmed.match(/^(\d+\.\s)(.*)$/);
        if (match) {
          return `${match[1]}${opener}${match[2]}`;
        }
      }

      return line;
    })
    .join("\n");
}

function adaptSectionContent(type, content, profile) {
  if (!content || !profile) return content;

  const cleaned = String(content).trim();

  if (!cleaned) return cleaned;

  if (type === "poem") return cleaned;

  if (type === "echo") {
    return prependIfMissing(cleaned, buildSectionPrefix("echo", profile));
  }

  if (type === "signal") {
    return prependIfMissing(cleaned, buildSectionPrefix("signal", profile));
  }

  if (type === "pattern") {
    return prependIfMissing(cleaned, buildSectionPrefix("pattern", profile));
  }

  if (type === "tension") {
    const adapted = prependIfMissing(
      cleaned,
      buildSectionPrefix("tension", profile)
    );
    return adaptRecommendationsInText(adapted, profile);
  }

  return cleaned;
}

function adaptCoreCard(coreCard = {}, profile) {
  if (!coreCard || !profile) return coreCard;

  const hook = coreCard?.hook || "";

  if (!hook) return coreCard;

  const prefixMap = {
    grounding: "Take the clearest read first. ",
    guiding: "There is meaning here if you stay with it. ",
    challenging: "This card wants to be tested, not merely admired. ",
    reflective: "This card reveals the shape beneath the moment. ",
  };

  const prefix = prefixMap[profile.tone] || "";

  if (hook.toLowerCase().startsWith(prefix.toLowerCase().trim())) {
    return coreCard;
  }

  return {
    ...coreCard,
    hook: `${prefix}${hook}`.trim(),
  };
}

// -------------------------
// PROMPT
// -------------------------

function buildLiveCastPrompt({
  question,
  sourceText,
  userContext,
  engagementMode,
  engagementProfile,
}) {
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

ENGAGEMENT MODE:
${engagementMode || "seeker"}

ENGAGEMENT GUIDANCE:
Caster communication style should lean ${engagementProfile?.tone || "guiding"}.
Emphasize ${engagementProfile?.emphasis || "meaning"}.
Use advice style ${engagementProfile?.adviceStyle || "encouraging_direction"}.
Do not label or diagnose the user.
Adapt wording so the cast feels understood by this type of user.

INSTRUCTIONS:

- Interpret, do NOT summarize
- Ignore timestamps and filler
- Be grounded, not mystical nonsense
- Be emotionally precise
- Echo should be punchy and shareable
- Do not mention engagement mode explicitly
- Let tone subtly match the caster's engagement style
- Core card hook should reflect the caster's communication posture
- Signal, Tension, Pattern, Poem, and Echo must each do different work
- Avoid starting multiple sections with the same sentence stem
- Signal should reveal what is surfacing now
- Tension should describe the active conflict, strain, or pressure
- Pattern should explain the recurring structure underneath the issue
- Echo should compress the cast into a memorable line

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
// NORMALIZATION
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
  engagement,
  metadata,
}) {
  const map = new Map();

  for (const s of sections || []) {
    const normalized = normalizeType(s.type);
    const content = typeof s.content === "string" ? s.content : "";
    map.set(normalized, createSection(normalized, content));
  }

  for (const type of SECTION_ORDER) {
    if (!map.has(type)) {
      map.set(type, createSection(type, ""));
    }
  }

  const finalSections = SECTION_ORDER.map((t) => map.get(t));
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
        body: shareables?.echoCard?.body || echoSection?.content || "",
        vibe: shareables?.echoCard?.vibe || "neutral",
      },
    },

    echo: echoSection?.content || "",
    engagement: engagement || null,
    metadata: metadata || {},

    sections: finalSections,
  };
}

// -------------------------
// NO AI STATE
// -------------------------

function buildNoAIState(input, engagement = null, metadata = {}) {
  return {
    id: `noai-${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode: "no-ai",
    title: "AI Connection Required",
    subtitle: "Eidomancer requires live AI access to interpret your input.",
    input,
    echo: "",
    engagement,
    metadata,
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

  if (cast.coreCard?.hook) {
    lines.push("");
    lines.push("Core Card");
    lines.push(cast.coreCard.hook);
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
    payload = {
      question: input,
      sourceText: "",
      userContext: "",
      history: [],
    };
  } else {
    payload = {
      question: input?.question || "",
      sourceText: input?.sourceText || "",
      userContext: input?.userContext || "",
      history: Array.isArray(input?.history) ? input.history : [],
    };
  }

  const cleanedQuestion = cleanInputText(payload.question);
  const cleanedSource = cleanInputText(payload.sourceText);

  const engagementDetection = detectEngagementMode(
    cleanedQuestion,
    payload.history
  );

  const engagementProfile =
    engagementModeProfiles[engagementDetection.mode] ||
    engagementModeProfiles.seeker;

  const engagement = buildEngagementOverlay(
    engagementProfile,
    engagementDetection
  );

  const metadata = {
    engagementMode: engagementDetection.mode,
    engagementConfidence: engagementDetection.confidence,
    engagementScores: engagementDetection.scores,
  };

  if (!USE_LIVE_API) {
    return buildNoAIState(cleanedQuestion, engagement, metadata);
  }

  const prompt = buildLiveCastPrompt({
    question: cleanedQuestion,
    sourceText: cleanedSource,
    userContext: payload.userContext,
    engagementMode: engagementDetection.mode,
    engagementProfile,
  });

  try {
    const raw = await callLLM(prompt);
    const parsed = tryParseJSON(raw);

    if (parsed && parsed.sections) {
      const adaptedSections = (parsed.sections || []).map((section) => {
        const normalizedType = normalizeType(section?.type);
        const originalContent =
          typeof section?.content === "string" ? section.content : "";

        return {
          ...section,
          type: normalizedType,
          content: adaptSectionContent(
            normalizedType,
            originalContent,
            engagementProfile
          ),
        };
      });

      const adaptedCoreCard = adaptCoreCard(parsed.coreCard, engagementProfile);

      return createCast({
        ...parsed,
        coreCard: adaptedCoreCard,
        sections: adaptedSections,
        input: cleanedQuestion,
        question: cleanedQuestion,
        sourceText: cleanedSource,
        userContext: payload.userContext,
        engagement,
        metadata,
      });
    }

    return buildNoAIState(cleanedQuestion, engagement, metadata);
  } catch {
    return buildNoAIState(cleanedQuestion, engagement, metadata);
  }
}