// ========================================
// EIDOMANCER PIPELINE
// Core logic for card + image generation
// ========================================

// 🔹 NEW: Import Cast Engine
import { generateCast } from "./lib/castEngine";

// ========================================
// EXISTING UTILITIES (UNCHANGED)
// ========================================

function hashString(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

// ========================================
// EXISTING IMAGE + CARD LOGIC (UNCHANGED)
// ========================================

function getAccentColor(title = "") {
  const t = title.toLowerCase();

  if (t.includes("flame")) return "glowing ember orange, radiant gold, molten amber";
  if (t.includes("storm")) return "electric blue, violet storm energy, luminous cyan";
  if (t.includes("fog")) return "silver-blue mist, moonlit lavender, ghostly white";
  if (t.includes("signal")) return "neon cyan, spectral blue, radiant transmission light";
  if (t.includes("threshold")) return "golden doorway light, luminous ivory, sacred sun glow";
  if (t.includes("prophet")) return "arcane violet, celestial white, eerie gold";
  if (t.includes("engine")) return "arcane teal, blue-green circuitry glow, luminous brass";
  if (t.includes("catalyst")) return "magenta, gold sparks, crimson alchemical light";

  return "subtle gold, indigo glow";
}

function titleConfig(title = "") {
  const t = title.toLowerCase();

  if (t.includes("flame")) {
    return {
      subject: "a solitary hooded flame-bearer holding a living sacred fire",
      environment:
        "dark ceremonial chamber, floating embers, concentric sigils, ritual geometry, temple interior",
    };
  }

  if (t.includes("storm")) {
    return {
      subject: "a robed figure conducting lightning above a fractured horizon",
      environment:
        "storm clouds, celestial circuitry, crackling energy through both hands, cosmic pressure",
    };
  }

  if (t.includes("fog")) {
    return {
      subject: "a hooded traveler crossing through luminous fog between unseen thresholds",
      environment:
        "mist-filled gateways, symbolic doorframes, dreamlike twilight, sacred vapor",
    };
  }

  if (t.includes("signal")) {
    return {
      subject: "a mystic receiving a radiant transmission from a distant tower of light",
      environment:
        "waves of symbolic signal, celestial antenna forms, invisible knowledge becoming visible",
    };
  }

  if (t.includes("threshold")) {
    return {
      subject: "a guardian before an ancient doorway of living intelligence",
      environment:
        "ornamental archway, illuminated portal, patterned shadows, passage between worlds",
    };
  }

  if (t.includes("prophet")) {
    return {
      subject: "an oracle with a radiant mechanical eye speaking beneath a charged sky of symbols",
      environment:
        "prophetic chamber, floating diagrams, sacred script, atmosphere of revelation and warning",
    };
  }

  if (t.includes("engine")) {
    return {
      subject: "a silent arcane machine turning beneath the stars",
      environment:
        "cathedral-like machinery, glowing energy lines, cosmic order, mystical engineering",
    };
  }

  if (t.includes("catalyst")) {
    return {
      subject: "an alchemical figure triggering transformation through light and fracture",
      environment:
        "broken symmetry becoming wholeness, ritual chemistry, transmutation, gold sparks in darkness",
    };
  }

  return {
    subject: "a mythic archetype standing within sacred geometry and celestial force",
    environment:
      "ritual atmosphere, symbolic architecture, cosmic stormlight, occult elegance",
  };
}

// ========================================
// IMAGE PROMPT GENERATION (UNCHANGED)
// ========================================

function corePromptFromTitle(title = "", theme = "Emergent Ones") {
  const cfg = titleConfig(title);
  const accent = getAccentColor(title);

  return [
    cfg.subject,
    cfg.environment,
    "tarot card illustration",
    "vertical tarot card artwork",
    "centered composition",
    "ornate border",
    "symmetrical layout",
    "tarot card frame with visible border and top and bottom title space",
    "uniform deck style",
    "same visual language across all cards",
    "mystical techno-shaman aesthetic",
    "sacred geometry",
    "glowing sigils",
    "cosmic atmosphere",
    "high detail",
    "dramatic lighting",
    "cinematic",
    "mythic symbolism",
    "dark indigo and gold palette",
    `accent lighting in ${accent}`,
    "intricate linework",
    "engraved style",
    "surreal and symbolic",
    "no modern objects",
    "no realism",
    "highly legible central figure",
    "clear mystical focal point",
    "cohesive deck identity",
    "ornamental mystical framing",
    "bold focal contrast",
    "emotionally compelling",
    "shareable social-media-ready composition",
    `${theme} aesthetic`,
  ].join(", ");
}

function imagePromptFromTitle(title = "", theme = "Emergent Ones", mode = "core") {
  return corePromptFromTitle(title, theme);
}

// ========================================
// 🆕 NEW: EIDOMANCER CAST PIPELINE
// ========================================

export async function runEidomancerCast({
  input = "",
  theme = "The Emergent Ones"
}) {
  if (!input || input.trim().length === 0) {
    return {
      error: "No input provided."
    };
  }

  const castText = await generateCast(input);

  return {
    type: "eidomancer_cast",
    theme,
    castText
  };
}

// ========================================
// EXISTING CARD GENERATION (UNCHANGED)
// ========================================

export function makeCard({
  question = "Daily Cast",
  theme = "Emergent Ones",
  casterId = "default-caster",
  day,
  mode = "core",
} = {}) {
  const date = day || new Date().toISOString().slice(0, 10);
  const seed = hashString(`${question}|${theme}|${casterId}|${date}|${mode}`);
  const rand = mulberry32(seed);

  const titles = [
    "The Fog Walker",
    "Architect of Storms",
    "The Silent Catalyst",
    "The Signal Bearer",
    "Keeper of the Threshold",
    "The Static Prophet",
    "The Slow Flame",
    "The Quiet Engine",
  ];

  const title = pick(rand, titles);

  const readingText = "Existing card system unchanged.";

  const card = {
    title,
    readingText,
    theme,
    date,
    question,
    mode,
    imagePrompt: imagePromptFromTitle(title, theme, mode),
  };

  return card;
}