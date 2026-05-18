// D:\eidomancer\src\lib\dailyCast.js

const TITLES = [
  "Architect of Storms",
  "Lantern of the Threshold",
  "The Quiet Engine",
  "Signal in the Fog",
  "Keeper of the Unfinished Fire",
  "The Measured Flame",
];

const SIGNALS = {
  low: "Your system is signaling limited reserves. Friction is not failure today.",
  medium:
    "Your system is balancing strain and possibility. Direction matters more than intensity.",
  high:
    "Your system is carrying charge and momentum. Use it deliberately before it scatters.",
};

const MOOD_INTERPRETATIONS = {
  reflective:
    "The pattern suggests a mind trying to translate lived experience into structure and meaning.",
  tired:
    "The pattern suggests your will is present, but your body is negotiating the cost of continued effort.",
  hopeful:
    "The pattern suggests an opening in the fog: not certainty, but enough signal to move.",
  frustrated:
    "The pattern suggests pressure without clean release. Simplicity is a form of power today.",
  focused:
    "The pattern suggests converging threads. What matters now is disciplined follow-through.",
};

const FOCUS_ACTIONS = {
  clarity:
    "Choose one concrete task and finish only that before expanding outward.",
  healing:
    "Reduce needless friction today and make recovery part of the work, not the enemy of it.",
  momentum: "Take the smallest visible action that proves movement is real.",
  income: "Do one thing today that improves the path from idea to product.",
  creativity:
    "Capture one symbol, one phrase, or one design that feels alive and worth returning to.",
};

const RESONANCE_FLAVOR = {
  dissonant:
    "The pattern resolves through fractured rhythm and cold circuitry.",
  soft: "The signal carries gently, rebuilding meaning through quiet tones.",
  forge: "The current sharpens itself through pressure, heat, and forward force.",
  inner:
    "The sound turns inward, translating thought and feeling into intimate motion.",
  transcendent:
    "The pattern widens beyond the self, reaching toward scale, wonder, and ascent.",
  chaotic:
    "The signal mutates through rupture, irony, and unstable momentum.",
  grave:
    "The sound settles into weight, silence, and the dignity of endings.",
  balanced:
    "The current moves with steadiness, coherence, and measured breath.",
  synthetic:
    "The signal arrives through luminous machinery and reflective dream logic.",
  ancestral:
    "The pattern echoes through old roots, memory, ritual, and inherited fire.",
};

const GENRE_POOLS = {
  dissonant: ["industrial", "dark electronic", "glitch"],
  soft: ["ambient", "piano", "post-rock"],
  forge: ["metal", "hard rock", "industrial rock"],
  inner: ["indie folk", "acoustic", "lofi"],
  transcendent: ["cinematic", "synthwave", "orchestral"],
  chaotic: ["hyperpop", "glitchcore", "experimental"],
  grave: ["dark ambient", "piano minimal", "drone"],
  balanced: ["chill electronic", "neo-soul", "jazz"],
  synthetic: ["vaporwave", "retro synth", "AI ambient"],
  ancestral: ["irish folk", "tribal", "nordic folk"],
};

function pickTitle(profile) {
  const seed = `${profile.name}-${profile.mood}-${profile.energy}-${profile.focus}`;
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return TITLES[total % TITLES.length];
}

function getResonanceType(profile = {}) {
  const mood = String(profile.mood || "").toLowerCase();
  const energy = String(profile.energy || "").toLowerCase();
  const focus = String(profile.focus || "").toLowerCase();

  if (mood === "frustrated" && energy === "high") return "forge";
  if (mood === "tired") return "grave";
  if (mood === "hopeful") return "soft";
  if (focus === "income") return energy === "high" ? "forge" : "dissonant";
  if (mood === "focused") return "balanced";
  if (mood === "reflective") return "inner";
  if (focus === "creativity") return "transcendent";
  if (focus === "healing") return "soft";
  if (focus === "clarity") return "balanced";
  if (focus === "momentum") return energy === "high" ? "forge" : "synthetic";

  return "synthetic";
}

function pickFromPool(items = [], seedText = "") {
  if (!Array.isArray(items) || items.length === 0) return "";

  let total = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    total += seedText.charCodeAt(i);
  }

  return items[total % items.length];
}

function buildSunoPrompt({
  title,
  resonance,
  genre,
  mood,
  energy,
  focus,
  signal,
  interpretation,
}) {
  const energyMap = {
    low: "gentle, spacious, restrained",
    medium: "steady build, layered emotion, controlled release",
    high: "driving, charged, emotionally intense",
  };

  const moodMap = {
    reflective: "introspective, philosophical, inward-looking",
    tired: "worn down, delicate, honest, low-burning",
    hopeful: "cautiously uplifting, searching, quietly luminous",
    frustrated: "tense, pressurized, restless, confrontational",
    focused: "disciplined, clear, deliberate, forward-moving",
  };

  return [
    `Genre: ${genre}`,
    `Resonance: ${resonance}`,
    `Mood: ${moodMap[mood] || "thoughtful, emotionally restrained, reflective"}`,
    `Energy: ${energyMap[energy] || energyMap.medium}`,
    "Vocals: emotionally controlled, intelligent, expressive without oversinging",
    `Theme focus: ${focus || "personal direction"}`,
    `Lyrical direction: ${signal} ${interpretation}`,
    "Production: cinematic texture, strong atmosphere, clear emotional arc, memorable chorus",
    "Style: suitable for Eidomancer, mystical but grounded, symbolic rather than generic",
  ].join(". ");
}

export function generateDailyCast(profile = {}) {
  const safeProfile = {
    name: profile.name || "Caster",
    mood: profile.mood || "reflective",
    energy: profile.energy || "medium",
    focus: profile.focus || "clarity",
  };

  const title = pickTitle(safeProfile);
  const signal = SIGNALS[safeProfile.energy] || SIGNALS.medium;
  const interpretation =
    MOOD_INTERPRETATIONS[safeProfile.mood] ||
    "The pattern suggests a need to separate noise from signal before deciding where to aim your effort.";
  const action =
    FOCUS_ACTIONS[safeProfile.focus] ||
    "Choose one grounded step that aligns reality with intention.";

  const resonance = getResonanceType(safeProfile);

  const genreSeed = [
    safeProfile.name,
    safeProfile.mood,
    safeProfile.energy,
    safeProfile.focus,
    title,
    resonance,
  ].join("-");

  const genre = pickFromPool(GENRE_POOLS[resonance], genreSeed) || "dark electronic";

  const resonanceFlavor =
    RESONANCE_FLAVOR[resonance] ||
    "The signal arrives through luminous machinery and reflective dream logic.";

  return {
    date: new Date().toISOString(),
    title,
    signal,
    interpretation,
    action,
    resonance: {
      type: resonance,
      flavor: resonanceFlavor,
    },
    audio: {
      genre,
      sunoPrompt: buildSunoPrompt({
        title,
        resonance,
        genre,
        mood: safeProfile.mood,
        energy: safeProfile.energy,
        focus: safeProfile.focus,
        signal,
        interpretation,
      }),
    },
    imagePrompt: `${title}, Eidomancer tarot card, The Emergent Ones theme, techno-mystic symbolism, semi-gothic framing, rustic tarot composition, luminous atmosphere, clear focal subject, symbolic environmental storytelling`,
  };
}