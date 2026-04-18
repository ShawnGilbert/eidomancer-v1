// D:\eidomancer\src\lib\resonanceEngine.js

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

function detectSignal(sections = []) {
  const text = sections.map(s => s?.content || "").join(" ").toLowerCase();

  if (text.includes("society") || text.includes("system")) return "societal";
  if (text.includes("anger") || text.includes("fight")) return "conflict";
  if (text.includes("loss") || text.includes("grief")) return "loss";
  if (text.includes("grow") || text.includes("become")) return "growth";
  if (text.includes("absurd") || text.includes("irony")) return "absurd";

  return "personal";
}

function detectPattern(sections = []) {
  const text = sections.map(s => s?.content || "").join(" ").toLowerCase();

  if (text.includes("break") || text.includes("collapse")) return "breakdown";
  if (text.includes("rebuild") || text.includes("heal")) return "rebuild";
  if (text.includes("transform") || text.includes("change")) return "transform";
  if (text.includes("reflect") || text.includes("look inward")) return "reflect";
  if (text.includes("balance") || text.includes("align")) return "stabilize";

  return "reflect";
}

function detectTension(sections = []) {
  const text = sections.map(s => s?.content || "").join(" ").toLowerCase();

  let score = 0;

  if (text.includes("anger") || text.includes("rage")) score += 4;
  if (text.includes("collapse") || text.includes("crisis")) score += 3;
  if (text.includes("uncertain") || text.includes("conflict")) score += 2;

  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function resolveResonance({ signal, pattern, tension }) {
  if (signal === "societal" && pattern === "breakdown") return "dissonant";
  if (signal === "loss") return "grave";
  if (signal === "conflict" && tension === "high") return "forge";
  if (pattern === "rebuild") return "soft";
  if (pattern === "transform") return "transcendent";
  if (pattern === "reflect") return "inner";
  if (signal === "absurd") return "chaotic";
  if (pattern === "stabilize") return "balanced";

  return "synthetic";
}

function pickGenre(pool = [], history = []) {
  const filtered = pool.filter(g => !history.includes(g));
  const choices = filtered.length ? filtered : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function generateResonance(cast, history = []) {
  const sections = cast?.sections || [];

  const signal = detectSignal(sections);
  const pattern = detectPattern(sections);
  const tension = detectTension(sections);

  const resonance = resolveResonance({ signal, pattern, tension });
  const pool = GENRE_POOLS[resonance] || GENRE_POOLS.synthetic;
  const genre = pickGenre(pool, history);

  return {
    resonance,
    genre,
    signal,
    pattern,
    tension,
  };
}