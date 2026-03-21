// ========================================
// EIDOMANCER PIPELINE
// Core logic for card + image generation
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

// === IMAGE PROMPT GENERATION ===
// Builds the text prompt sent to the image model

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

// === MYTHIC PROMPT GENERATION ===
// Breaks tarot structure entirely

function mythicPromptFromTitle(title = "", theme = "Emergent Ones") {
  const cfg = titleConfig(title);
  const accent = getAccentColor(title);

  return [
    cfg.subject,
    cfg.environment,
    "legendary collector-tier artwork",
    "mythic rarity visual",
    "cosmic spectacle illustration",
    "surreal reality-bending scene",
    "epic sci-fi fantasy concept art",
    "cinematic scene",
    "wide-angle composition",
    "environment-driven image",
    "no frame, no border, no card layout",
    "not a tarot card",
    "not an illustration inside a frame",
    "subject integrated into the world",
    "subject not centered like a portrait",
    "camera perspective, not flat composition",
    "dynamic asymmetrical composition",
    "massive glowing energy source dominating the sky",
    "huge celestial object or radiant core",
    "environment much larger than the subject",
    "monumental sacred geometry built into the world",
    "large-scale architecture or cosmic structures",
    "explosive lighting",
    "energy beams, arcs, particles, luminous atmosphere",
    "high contrast between darkness and radiant power",
    "epic moment frozen in time",
    `vivid color palette with ${accent}`,
    "bright luminous highlights",
    "strong color separation",
    "rich saturation",
    "not muted, not washed out",
    "AAA game cinematic art",
    "high detail environment storytelling",
    "fantasy concept art",
    "visually overwhelming in a beautiful way",
    "foreground, midground, background depth",
    "atmospheric perspective",
    "world scale, not portrait scale",
    "impossible geometry",
    "reality folding into itself",
    "light behaving like liquid",
    "cosmic scale intelligence presence",
    "multiple layers of meaning",
    "symbolic systems embedded in the environment",
    "fractals, recursion, infinite patterns",
    "awe-inspiring, overwhelming, transcendent",
    "feels like witnessing something beyond human scale",
    "collector-poster energy",
    "awe-inspiring spectacle",
    `${theme} aesthetic`,
  ].join(", ");
}

// === MODE SWITCHING LOGIC ===
// Controls Core vs Mythic behavior

function imagePromptFromTitle(title = "", theme = "Emergent Ones", mode = "core") {
  if (mode === "mythic") {
    return mythicPromptFromTitle(title, theme);
  }
  return corePromptFromTitle(title, theme);
}

// === MAIN CARD GENERATION ===
// Entry point: builds full card object

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

  const openingLines = [
    "By the indifferent regularities of physics:",
    "By the slow machinery of reality:",
    "By the hidden math beneath your mood:",
    "By the shape of energy moving through the day:",
    "By the pressure of the real against the imagined:",
  ];

  const stateLines = [
    "Your energy ebbs with disrupted circadian light.",
    "Your momentum is being taxed by too many open loops.",
    "Your attention is fraying across too many possible futures.",
    "Your signal weakens when every task feels equally important.",
    "Your clarity improves the moment one concrete step is chosen.",
  ];

  const physicsLines = [
    "Physics first. Without the laws of reality, no myth, dream, or transcendence can take shape.",
    "Reality answers structure more reliably than intention alone.",
    "Coherence beats intensity. One aligned act outweighs ten imagined ones.",
    "The world does not require inspiration first; it often grants inspiration after motion begins.",
  ];

  const adviceLines = [
    "You walk between currents. Choose one current and let the others pass.",
    "Reduce noise. Protect the next hour from ornamental distraction.",
    "Shrink the scope until action becomes undeniable.",
    "Treat indecision as friction, not mystery.",
    "A small completed act will restore more power than another spiral of possibility.",
  ];

  const readingText = [
    `${pick(rand, openingLines)} ${pick(rand, stateLines)}`,
    "",
    pick(rand, physicsLines),
    "",
    `In the tongue of The Emergent Ones: ${pick(rand, adviceLines)}`,
  ].join("\n");

  // === FINAL CARD OUTPUT ===
  // Returns structured card data to UI
  return {
    title,
    readingText,
    theme,
    date,
    question,
    mode,
    imagePrompt: imagePromptFromTitle(title, theme, mode),
  };
}