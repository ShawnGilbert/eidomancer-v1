// D:\eidomancer\src\lib\castEngine.js

const USE_LIVE_API = false;
const MAX_INPUT_CHARS = 4000;
const MAX_FALLBACK_SNIPPET_CHARS = 900;
const VALID_SECTION_TYPES = new Set(["signal", "tension", "pattern", "poem", "echo"]);

// -------------------------
// CLEANING
// -------------------------

function asString(value = "") {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function normalizeWhitespace(text = "") {
  return asString(text)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripTimestamps(text = "") {
  return asString(text).replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "");
}

function stripUiNoise(text = "") {
  const lines = asString(text).split("\n");

  return lines
    .filter((line) => {
      const t = line.trim().toLowerCase();
      if (!t) return true;

      if (
        t === "transcript" ||
        t === "show transcript" ||
        t === "description" ||
        t === "comments"
      ) {
        return false;
      }

      if (/^@\w+/.test(t)) return false;
      if (/^https?:\/\//.test(t)) return false;

      return true;
    })
    .join("\n");
}

function looksLikeTranscript(text = "") {
  const normalized = normalizeWhitespace(text);
  if (normalized.length > 1500) return true;

  const lines = normalized.split("\n").filter(Boolean);
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
  const normalized = asString(text);
  if (normalized.length <= MAX_FALLBACK_SNIPPET_CHARS) return normalized;
  return normalized.slice(0, MAX_FALLBACK_SNIPPET_CHARS) + "...";
}

// -------------------------
// ANALYSIS
// -------------------------

function detectQuestionType(text = "") {
  const cleaned = normalizeWhitespace(text);
  const t = cleaned.toLowerCase();

  if (!t) return "general";
  if (looksLikeTranscript(cleaned)) return "transcript";

  if (
    /\b(why|meaning|purpose|soul|truth|reality|belief|faith|god|ethics|morality|philosophy)\b/.test(
      t
    )
  ) {
    return "philosophical";
  }

  if (
    /\b(should|decision|choose|which|stay|leave|move|buy|sell|start|stop|next step)\b/.test(
      t
    )
  ) {
    return "decision";
  }

  if (
    /\b(feel|hurt|sad|angry|lonely|grief|afraid|fear|anxiety|empty|overwhelmed|heart)\b/.test(
      t
    )
  ) {
    return "emotional";
  }

  if (
    /\b(work|project|build|app|code|system|design|engine|workflow|ship|launch)\b/.test(
      t
    )
  ) {
    return "constructive";
  }

  if (
    /\b(person|relationship|friend|wife|girlfriend|boyfriend|family|father|mother|paul)\b/.test(
      t
    )
  ) {
    return "relational";
  }

  return "general";
}

function inferPoemShape({
  sourceType = "question",
  questionType = "general",
  input = "",
}) {
  const t = normalizeWhitespace(input).toLowerCase();

  if (sourceType === "transcript") return "signal_column";
  if (questionType === "decision") return "fork";
  if (questionType === "emotional") return "wave";
  if (questionType === "constructive") return "steps";
  if (questionType === "relational") return "mirror";
  if (questionType === "philosophical") return "spiral";

  if (/\b(split|divide|two paths|fork|either|or)\b/.test(t)) return "fork";
  if (/\b(ocean|wave|flood|drift|current)\b/.test(t)) return "wave";
  if (/\b(build|tower|ladder|climb|structure)\b/.test(t)) return "steps";

  return "free_verse";
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
// STRUCTURED CAST HELPERS
// -------------------------

function normalizeSectionType(type = "signal") {
  const normalized = normalizeWhitespace(type).toLowerCase();
  return VALID_SECTION_TYPES.has(normalized) ? normalized : "signal";
}

function createSection(type, label, content, meta = {}) {
  const normalizedContent = normalizeWhitespace(content);
  const normalizedLabel = normalizeWhitespace(label);

  return {
    type: normalizeSectionType(type),
    label: normalizedLabel,
    content: normalizedContent,
    ...meta,
  };
}

function createCast({
  title,
  subtitle = "",
  mode = "default",
  sourceType = "question",
  questionType = "general",
  poemShape = "free_verse",
  seed = "",
  sections = [],
}) {
  const normalizedSections = sections
    .filter(Boolean)
    .map((section) =>
      createSection(
        section.type,
        section.label,
        section.content,
        section.shape ? { shape: section.shape } : {}
      )
    )
    .filter((section) => section.label && section.content);

  return {
    title: normalizeWhitespace(title),
    subtitle: normalizeWhitespace(subtitle),
    mode: normalizeWhitespace(mode) || "default",
    sourceType: normalizeWhitespace(sourceType) || "question",
    questionType: normalizeWhitespace(questionType) || "general",
    poemShape: normalizeWhitespace(poemShape) || "free_verse",
    seed: normalizeWhitespace(seed),
    sections: normalizedSections,
  };
}

export function formatCastAsText(cast) {
  if (!cast || typeof cast !== "object") return "";

  const lines = [];

  lines.push("🃏 Card Title");
  lines.push(cast.title || "Untitled Cast");

  if (cast.subtitle) {
    lines.push("");
    lines.push(cast.subtitle);
  }

  if (Array.isArray(cast.sections) && cast.sections.length) {
    for (const section of cast.sections) {
      lines.push("");
      lines.push(section.label || "Section");
      lines.push(section.content || "");
    }
  }

  return lines.join("\n");
}

// -------------------------
// POEM ENGINE
// -------------------------

function poemTemplates() {
  return {
    signal_column: [
      "There is always too much around the thing.",
      "",
      "Too much framing.",
      "Too much posture.",
      "Too much noise pretending to be weight.",
      "",
      "But the signal does not rush.",
      "",
      "It waits.",
      "",
      "A small bright line",
      "beneath the density.",
      "",
      "Not louder.",
      "Truer.",
      "",
      "And once it is heard,",
      "the rest begins to fall away.",
    ],

    fork: [
      "Two roads is a lie.",
      "",
      "There are always more.",
      "",
      "But only one",
      "can bear your full weight",
      "at the next step.",
      "",
      "You keep standing",
      "where the path divides,",
      "calling hesitation",
      "a form of wisdom.",
      "",
      "It is not.",
      "",
      "It is a tax.",
      "",
      "Choose.",
      "",
      "Not because the world is certain—",
      "but because motion requires allegiance.",
    ],

    wave: [
      "The feeling does not ask permission.",
      "",
      "It arrives.",
      "",
      "Then rises.",
      "Then fills the room.",
      "",
      "You think you are drowning",
      "because it touches everything.",
      "",
      "But not everything touched",
      "is everything true.",
      "",
      "A wave is real.",
      "",
      "It is not the ocean.",
      "",
      "Stand long enough",
      "to feel where it breaks.",
      "",
      "What remains after",
      "is closer to your name.",
    ],

    steps: [
      "Nothing grand begins as grand.",
      "",
      "A frame.",
      "A beam.",
      "A hand deciding where to place the next piece.",
      "",
      "You do not need the whole cathedral.",
      "",
      "You need",
      "the next honest part",
      "built well enough",
      "to carry weight.",
      "",
      "The future is not assembled all at once.",
      "",
      "It is stacked.",
      "",
      "And what you repeat",
      "becomes architecture.",
    ],

    mirror: [
      "Another person",
      "is never only another person.",
      "",
      "They become",
      "a surface.",
      "",
      "A distortion.",
      "A reflection.",
      "A test.",
      "",
      "You look for them",
      "and find yourself",
      "arriving in fragments.",
      "",
      "What hurts is not always what they did.",
      "",
      "Sometimes it is what their presence",
      "makes impossible to ignore.",
      "",
      "So look carefully.",
      "",
      "The mirror is not the wound.",
      "",
      "But it can reveal it.",
    ],

    spiral: [
      "You circle the same fire",
      "because the question is larger than an answer.",
      "",
      "Each pass changes distance.",
      "Each pass changes angle.",
      "",
      "What feels like repetition",
      "may actually be descent.",
      "",
      "Or ascent.",
      "",
      "Truth rarely waits",
      "at the first encounter.",
      "",
      "It asks to be revisited",
      "until language thins",
      "and shape remains.",
      "",
      "Keep circling.",
      "",
      "Not forever.",
      "",
      "Just until the pattern yields.",
    ],

    free_verse: [
      "There is movement here.",
      "",
      "Not clean movement.",
      "Not complete movement.",
      "",
      "But enough",
      "to prove the system is alive.",
      "",
      "Something is pressing forward.",
      "Something is pressing back.",
      "",
      "This is not failure.",
      "",
      "It is friction.",
      "",
      "And friction, when read correctly,",
      "becomes a map of contact",
      "between desire and reality.",
    ],
  };
}

function shapePoemLines(lines, shape) {
  switch (shape) {
    case "signal_column":
      return lines.map((line, i) => {
        if (!line) return "";
        const indent = i % 3 === 0 ? "" : i % 3 === 1 ? "  " : "    ";
        return indent + line;
      });

    case "fork":
      return lines.map((line, i) => {
        if (!line) return "";
        if (i < 6) return line;
        const indent = i % 2 === 0 ? "  " : "      ";
        return indent + line;
      });

    case "wave":
      return lines.map((line, i) => {
        if (!line) return "";
        const cycle = i % 6;
        const indentMap = ["", "  ", "    ", "      ", "    ", "  "];
        return indentMap[cycle] + line;
      });

    case "steps":
      return lines.map((line, i) => {
        if (!line) return "";
        return `${"  ".repeat(Math.min(i, 8))}${line}`;
      });

    case "mirror":
      return lines.map((line, i) => {
        if (!line) return "";
        if (i % 2 === 0) return line;
        return `    ${line}`;
      });

    case "spiral":
      return lines.map((line, i) => {
        if (!line) return "";
        const indent = " ".repeat((i * 2) % 12);
        return indent + line;
      });

    default:
      return lines;
  }
}

function buildPoem({
  sourceType = "question",
  questionType = "general",
  input = "",
}) {
  const shape = inferPoemShape({ sourceType, questionType, input });
  const templates = poemTemplates();
  const baseLines = templates[shape] || templates.free_verse;
  const shapedLines = shapePoemLines(baseLines, shape);

  return {
    shape,
    content: shapedLines.join("\n"),
  };
}

// -------------------------
// FALLBACK CAST (STRUCTURED)
// -------------------------

function buildFallbackCastFromSeed(seed = "", input = "") {
  const { cleaned, transcriptLike } = cleanInputText(input);
  const sourceType = transcriptLike ? "transcript" : "question";
  const questionType = detectQuestionType(cleaned);
  const poem = buildPoem({
    sourceType,
    questionType,
    input: cleaned,
  });

  if (transcriptLike) {
    return createCast({
      title: "The Signal Beneath Density",
      subtitle: "A cast for compressed meaning hidden inside excess.",
      mode: "fallback",
      sourceType,
      questionType,
      poemShape: poem.shape,
      seed,
      sections: [
        createSection(
          "signal",
          "Signal",
          "You are facing something large, but most of it is not the point."
        ),
        createSection(
          "tension",
          "Tension",
          "Volume creates the illusion of importance."
        ),
        createSection(
          "pattern",
          "Pattern",
          "The truth is smaller than the structure around it."
        ),
        createSection("poem", "Poem", poem.content, { shape: poem.shape }),
        createSection("echo", "Echo", "The signal survives the noise."),
      ],
    });
  }

  const titleMap = {
    philosophical: "The Spiral That Returns",
    decision: "The Weight of the Chosen Path",
    emotional: "The Tide Inside the Room",
    constructive: "The Architecture of the Next Step",
    relational: "The Mirror That Answers Back",
    general: "The Friction Beneath Motion",
  };

  const subtitleMap = {
    philosophical: "A cast for questions too large for shallow answers.",
    decision: "A cast for motion stalled by divided allegiance.",
    emotional: "A cast for feeling that floods the whole field of view.",
    constructive: "A cast for building reality one honest piece at a time.",
    relational: "A cast for what other people reveal by their presence.",
    general: "A cast for stalled momentum and divided direction.",
  };

  const signalMap = {
    philosophical:
      "You are not blocked by lack of intelligence, but by the size of the question.",
    decision:
      "You already know movement is required, but commitment still feels costly.",
    emotional:
      "Your inner weather is shaping your whole interpretation of the moment.",
    constructive:
      "You are trying to build something real, but the next piece still feels undefined.",
    relational:
      "The situation is not just about them; it is also exposing something in you.",
    general:
      "You are already moving, but something keeps interrupting you.",
  };

  const tensionMap = {
    philosophical:
      "You want truth that feels complete, but reality often reveals itself in layers.",
    decision:
      "You want certainty before action, but action is what creates clarity.",
    emotional:
      "The intensity of feeling is making itself seem more total than it is.",
    constructive:
      "Vision is present, but structure has not yet caught up.",
    relational:
      "You are trying to understand the other person without losing your own center.",
    general:
      "You want progress, but also certainty.",
  };

  const patternMap = {
    philosophical:
      "You are circling the same fire because the pattern has not fully yielded yet.",
    decision:
      "Too many possible futures are competing for the same step.",
    emotional:
      "A temporary wave is trying to present itself as permanent truth.",
    constructive:
      "Momentum increases when the next action becomes concrete enough to place.",
    relational:
      "Meaning is forming in the space between projection, reaction, and recognition.",
    general:
      "Too many paths are competing for the same step.",
  };

  const echoContent =
    sourceType === "transcript"
      ? "The signal survives the noise."
      : questionType === "decision"
      ? "Commitment turns possibility into direction."
      : questionType === "emotional"
      ? "The feeling is real, but it is not the whole sea."
      : questionType === "constructive"
      ? "What you build next matters more than what you imagine all at once."
      : questionType === "relational"
      ? "The mirror hurts most when it reflects what is ready to be seen."
      : questionType === "philosophical"
      ? "Not every true answer arrives in its final form."
      : "Movement begins when choice commits.";

  return createCast({
    title: titleMap[questionType] || titleMap.general,
    subtitle: subtitleMap[questionType] || subtitleMap.general,
    mode: "fallback",
    sourceType,
    questionType,
    poemShape: poem.shape,
    seed,
    sections: [
      createSection(
        "signal",
        "Signal",
        signalMap[questionType] || signalMap.general
      ),
      createSection(
        "tension",
        "Tension",
        tensionMap[questionType] || tensionMap.general
      ),
      createSection(
        "pattern",
        "Pattern",
        patternMap[questionType] || patternMap.general
      ),
      createSection("poem", "Poem", poem.content, { shape: poem.shape }),
      createSection("echo", "Echo", echoContent),
    ],
  });
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

  if (!res.ok) {
    throw new Error(`LLM failed (${res.status})`);
  }

  try {
    const data = JSON.parse(text);
    return data.text || data.output || data.result || "";
  } catch {
    return text;
  }
}

function normalizeLiveCastResponse(raw, seed = "", input = "") {
  const { cleaned, transcriptLike } = cleanInputText(input);
  const sourceType = transcriptLike ? "transcript" : "question";
  const questionType = detectQuestionType(cleaned);

  if (!raw) {
    return buildFallbackCastFromSeed(seed, cleaned);
  }

  if (typeof raw === "object" && raw.title && Array.isArray(raw.sections)) {
    return createCast({
      title: raw.title,
      subtitle: raw.subtitle || "",
      mode: raw.mode || "live",
      sourceType: raw.sourceType || sourceType,
      questionType: raw.questionType || questionType,
      poemShape: raw.poemShape || "free_verse",
      seed: raw.seed || seed,
      sections: raw.sections,
    });
  }

  if (typeof raw === "string") {
    const poem = buildPoem({ sourceType, questionType, input: cleaned });

    return createCast({
      title: "Live Cast",
      subtitle: "Structured from live output.",
      mode: "live",
      sourceType,
      questionType,
      poemShape: poem.shape,
      seed,
      sections: [
        createSection("signal", "Signal", raw),
        createSection("poem", "Poem", poem.content, { shape: poem.shape }),
      ],
    });
  }

  return buildFallbackCastFromSeed(seed, cleaned);
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

export async function generateCastFromSeed(seed, input = "") {
  if (!USE_LIVE_API) {
    return buildFallbackCastFromSeed(seed, input);
  }

  const raw = await callLLM(seed);
  return normalizeLiveCastResponse(raw, seed, input);
}

export async function generateCast(input) {
  const seed = await buildSeed(input);
  const cast = await generateCastFromSeed(seed, input);
  return cast;
}