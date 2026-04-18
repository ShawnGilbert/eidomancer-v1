// D:\eidomancer\src\lib\castEngine.js

function cleanText(value = "") {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripMarkdown(value = "") {
  return String(value || "")
    .replace(/[*_#>`~-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncate(value = "", max = 280) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function titleCase(value = "") {
  return String(value || "")
    .toLowerCase()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueLines(lines = []) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const key = stripMarkdown(line).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(cleanText(line));
  }

  return result;
}

function sentenceChunks(text = "") {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => cleanText(part))
    .filter(Boolean);
}

function pickShortLines(text = "", maxLines = 4) {
  const chunks = sentenceChunks(text);
  return chunks.slice(0, maxLines);
}

function normalizeSectionName(value = "") {
  return String(value || "").trim().toLowerCase();
}

function getSectionContent(sections = [], type = "") {
  const normalized = normalizeSectionName(type);
  const match = sections.find(
    (section) => normalizeSectionName(section?.type) === normalized
  );
  return cleanText(match?.content || "");
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickVariant(seedText = "", label = "", options = []) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const index = hashString(`${label}::${seedText}`) % options.length;
  return options[index];
}

function inferTone(text = "") {
  const source = String(text || "").toLowerCase();

  const heavyHits =
    (source.match(
      /\b(tired|exhausted|burned out|burnout|nihilist|nihilistic|nothing left|done playing|brutal|worthless|void|fatigue|overwhelmed|empty)\b/g
    ) || []).length;

  const sharpHits =
    (source.match(
      /\b(angry|rage|furious|hate|algorithm|market|pressure|forced|trapped|punish|corrupt|bug|broken|error|failure|wrong|fix)\b/g
    ) || []).length;

  const softHits =
    (source.match(
      /\b(hope|gentle|quiet|calm|simple|rest|soft|tender|allow|peace)\b/g
    ) || []).length;

  const absurdHits =
    (source.match(
      /\b(how now brown cow|nonsense|random|weird|absurd|playful|joke)\b/g
    ) || []).length;

  if (absurdHits >= 1 && sharpHits >= 1) return "playful-defiant";
  if (heavyHits >= 3 && sharpHits >= 2) return "exhausted-defiant";
  if (heavyHits >= 3) return "exhausted";
  if (sharpHits >= 3) return "defiant";
  if (softHits >= 2) return "quiet";
  if (absurdHits >= 1) return "playful";
  return "reflective";
}

function inferCoreCardName(text = "") {
  const source = String(text || "").toLowerCase();

  if (/\b(bug|broken|error|glitch|failure|fix|debug|wrong)\b/.test(source)) {
    return "The Fault in the Pattern";
  }

  if (
    /\b(exhausted|tired|burnout|burned out|nothing left|void|nihilist|nihilistic)\b/.test(
      source
    )
  ) {
    return "The Exhausted Signal";
  }

  if (/\b(algorithm|market|metrics|performance|perform|value)\b/.test(source)) {
    return "The Measured Self";
  }

  if (/\b(confused|lost|uncertain|drift|adrift|compass)\b/.test(source)) {
    return "The Fading Compass";
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return "The Trickster Prompt";
  }

  return "The Witness Under Pressure";
}

function inferCoreImagePrompt({ cardName, signal, tension, pattern, sourceText, question }) {
  const text = [cardName, signal, tension, pattern, sourceText, question]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(bug|broken|error|glitch|debug|failure|fix)\b/.test(text)) {
    return "A solitary symbolic figure studying a glowing fracture in reality, where a visible crack in the pattern emits dim coded light, tarot card composition, restrained surrealism, single central subject.";
  }

  if (
    /\b(exhausted|tired|burnout|burned out|void|nothing left|holding.*upright|pressure)\b/.test(
      text
    )
  ) {
    return "A lone figure standing waist-deep in dark still water beneath faint glowing symbols and watchful shapes, exhausted from holding themselves upright under invisible pressure, tarot card composition, symbolic, cohesive, single central subject.";
  }

  if (/\b(algorithm|metrics|market|measured|performance)\b/.test(text)) {
    return "A solitary figure surrounded by dim floating interface marks and measurement lines, caught between human softness and mechanical judgment, tarot card composition, symbolic, single central subject.";
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(text)) {
    return "A symbolic trickster figure in a surreal ritual space where language bends into looping echoes and playful impossible symbols, tarot card composition, cohesive, single central subject.";
  }

  return "A solitary symbolic figure in a restrained surreal setting, carrying emotional tension without chaos, tarot card composition, cohesive, single central subject.";
}

function buildPoemFromSections({ question = "", signal, tension, pattern }) {
  const source = [question, signal, tension, pattern].join(" ").toLowerCase();
  const variationSeed = [question, signal, tension, pattern].join(" :: ");

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "poem-bug", [
      cleanText(`A crack in the pattern
keeps catching the light

Look too long
and every seam becomes a suspect

Look away
and the real fracture keeps breathing`),

      cleanText(`The builder bends close
to a hairline break

the room fills with maybe

some faults are ghosts
and one of them is not`),

      cleanText(`A thin bright fracture
runs under the ritual floor

suspicion gathers there

even unfinished things
begin to sound guilty`),
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "poem-absurd", [
      cleanText(`A joke knocks once
on the temple door

if meaning wakes
it was alive

if not
it was only posing`),

      cleanText(`Nonsense enters laughing
and the chamber hesitates

too solemn
and the spell goes hollow

too literal
and the machine goes numb`),

      cleanText(`A playful phrase
crosses the circuit

what can still listen
without pretending

has range`),
    ]);
  }

  if (/\b(exhausted|tired|burnout|burned out|nothing left|overwhelmed|fatigue)\b/.test(source)) {
    return pickVariant(variationSeed, "poem-exhausted", [
      cleanText(`The signal is dim
but not gone

it is only tired
of climbing uphill

to prove it is real`),

      cleanText(`Something inside you
keeps pulling the weight

long after meaning
stops feeling warm

and starts sounding required`),

      cleanText(`Not emptiness

just a small bright thing
dragged too far
through the machinery of proof`),
    ]);
  }

  if (/\b(value|worth|prove|performance|perform|impressive)\b/.test(source)) {
    return pickVariant(variationSeed, "poem-value", [
      cleanText(`Worth put on its costume
and stepped into the light

now even honest feeling
waits backstage

for permission`),

      cleanText(`The soul clears its throat
before it speaks

somewhere along the way
being became
an audition`),

      cleanText(`What was simple
became legible

what was alive
learned to explain itself`),
    ]);
  }

  return pickVariant(variationSeed, "poem-default", [
    cleanText(`A small true thing
appears before language

pressure gathers around it

what survives
was never meant to hurry`),

    cleanText(`Signal comes softly

the mind reaches too fast

and meaning bruises
when it is handled
before it opens`),

    cleanText(`Something real
tries to stay whole

while thought circles it
asking for shape
too soon`),
  ]);
}

function buildEcho({ question, signal, tension, pattern, sourceText }) {
  const source = [question, signal, tension, pattern, sourceText]
    .join(" ")
    .toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return "The bug may be real, but so is the lens looking for it.";
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return "Sometimes the test is whether meaning survives nonsense.";
  }

  if (
    /\b(perform|performance|valuable|value|worth|allowed|prove)\b/.test(source)
  ) {
    return "I don’t want to be impressive. I want to be allowed.";
  }

  if (/\b(exhausted|tired|burnout|nothing left)\b/.test(source)) {
    return "You’re not broken. You’re over-optimized.";
  }

  if (/\b(algorithm|market|metrics)\b/.test(source)) {
    return "The system taught you to perform your own existence.";
  }

  return "Meaning arrives best when it is not forced.";
}
function avoidEchoOverlap(recommendation, echo) {
  if (!echo) return recommendation;

  const rec = recommendation.toLowerCase();
  const ech = echo.toLowerCase();

  // crude but effective overlap check
  if (rec.includes(ech.slice(0, 20))) {
    return null; // force regeneration
  }

  return recommendation;
}
function buildRecommendation({ question, tone, signal, tension, variationSeed }) {
  const source = [question, tone, signal, tension].join(" ").toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-bug", [
      "Pick one suspected fault and test only that. Ignore every other weird edge until you know whether this one reproduces.",
      "Write down the smallest concrete break you can name, then test it in isolation before you interpret the rest of the system.",
      "Reduce the scope. One bug, one test, one result. Do not diagnose the whole machine at once.",
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-absurd", [
      "Run one absurd prompt and one serious prompt back to back. Compare what changes and what stays stable.",
      "Use this as a calibration pass. Feed the system one playful input on purpose and note whether it stays flexible or goes generic.",
      "Treat play as a test harness. Try one ridiculous prompt, then one sincere one, and compare the symbolic range.",
    ]);
  }

  if (/\b(exhausted|burnout|nothing left|tired)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-exhausted", [
      "Do one thing today that does not need to be shared, improved, or justified.",
      "Reduce the demand. Pick one task and make it smaller before you try to finish it.",
      "Protect ten minutes of non-performative time. No posting, no optimizing, no proving.",
    ]);
  }

  if (/\b(value|valuable|worth|prove|performance|perform|impressive)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-value", [
      "Make one small decision today without asking whether it increases your value.",
      "Finish one honest action before you evaluate whether it was useful, impressive, or legible.",
      "Choose one thing to do badly but sincerely, just to break the reflex to perform competence.",
    ]);
  }

  if (/\b(angry|defiant|algorithm|market|pressure)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-defiant", [
      "Create first. Decide where it belongs only after it exists.",
      "Keep the platform out of the first draft. Make the thing before you ask what it can do for you.",
      "Separate expression from distribution for one cycle. Build it, then judge it later.",
    ]);
  }

  return pickVariant(variationSeed, "recommendation-default", [
    "Name one true thing about today without trying to improve it yet.",
    "Take one small action that clarifies the signal instead of expanding the story.",
    "Choose the smallest next move that makes tomorrow easier to read.",
  ]);
}

function buildInsight({ question, signal, tension, pattern, sourceText, variationSeed }) {
  const source = [question, signal, tension, pattern, sourceText]
    .join(" ")
    .toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "insight-bug", [
      "When you are looking for failure, every rough edge starts to glow. The real skill is separating a true bug from a system still taking shape.",
      "A builder’s mind can turn unfinished into broken if it stays in diagnostic mode too long. The deeper task is learning which flaws are structural and which are just the shape of emergence.",
      "The instinct to search for the hidden fault is useful, but it can also bend perception. Not every irregularity is the break you fear it is.",
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "insight-absurd", [
      "Absurd inputs reveal whether the system is rigid, fake-deep, or actually adaptive. Play can be a diagnostic tool.",
      "Nonsense is not meaningless here. It is pressure-testing. The joke reveals whether the symbolic engine can flex without collapsing into canned depth.",
      "Playfulness becomes useful the moment it stops being decoration and starts becoming a test of range. That is what this prompt is doing.",
    ]);
  }

  if (/\b(value|valuable|worth|prove|performance|perform)\b/.test(source)) {
    return pickVariant(variationSeed, "insight-value", [
      "You were trained to believe value must be demonstrated to exist. That is why even simple self-expression feels like a test.",
      "The pressure to prove worth rewires expression into audition. Once that happens, even honest feeling starts to sound like a performance review.",
      "When worth becomes something to demonstrate, being yourself starts to feel insufficient by default. That distortion is doing more damage than it first appears.",
    ]);
  }

  if (/\b(exhausted|burnout|nothing left|tired)\b/.test(source)) {
    return pickVariant(variationSeed, "insight-exhausted", [
      "The wish to stop performing is not failure. It is your system trying to return to baseline.",
      "Exhaustion is often the nervous system refusing one more cycle of forced meaning. That refusal is information, not weakness.",
      "Wanting out of the performance loop does not mean you are broken. It often means your inner system has reached the point where pretending costs too much.",
    ]);
  }

  return pickVariant(variationSeed, "insight-default", [
    "The conflict is usually not between depth and simplicity, but between being and being evaluated.",
    "The friction here is less about meaning itself and more about what happens when meaning feels observed, measured, or prematurely interpreted.",
    "What looks like confusion is often a collision between genuine signal and the pressure to convert it into something legible too quickly.",
  ]);
}

function buildPattern({ question, signal, tension, sourceText, fallback, variationSeed }) {
  const source = [question, signal, tension, sourceText].join(" ").toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "pattern-bug", [
      "This pattern belongs to people who are good at finding weak points. The gift is real, but so is the tendency to treat emergence like failure before it has finished becoming itself.",
      "The larger shape here is diagnostic overreach: a mind tuned to catch flaws so quickly that it sometimes mistakes rough formation for genuine structural damage.",
      "The broader pattern is a builder’s mind that keeps scanning for hidden faults. That makes you useful, but it can also make unfinished systems look more broken than they are.",
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "pattern-absurd", [
      "The broader pattern is that unserious language often becomes a better test than serious language. It strips away the easy path and shows whether meaning can still emerge.",
      "This pattern lives at the edge where play becomes calibration. Absurd prompts are useful because they reveal whether the engine can adapt or only pretend to.",
      "The broader pattern is that nonsense can expose the boundaries of a meaning engine. When a system handles playful input badly, it reveals where its symbolic range is still too narrow.",
    ]);
  }

  if (/\b(algorithm|market|metrics|youtube|audience)\b/.test(source)) {
    return pickVariant(variationSeed, "pattern-algorithm", [
      "The broader pattern is systemic: once measurement sits between the self and expression, sincerity begins mutating into strategy.",
      "What you are touching is not just personal. It is the cultural pressure that turns identity into output and output into proof of value.",
      "This is bigger than one mood. It is what happens when modern life puts metrics between expression and worth, until even authenticity starts to feel like a performance.",
    ]);
  }

  if (/\b(value|valuable|worth|prove|perform)\b/.test(source)) {
    return pickVariant(variationSeed, "pattern-value", [
      "This sits inside a larger social habit: turning inner life into evidence, explanation, and proof before it is allowed to simply be felt.",
      "The wider structure here is a world that rewards justification so aggressively that people start explaining themselves before they even know what they feel.",
      "The broader pattern is a culture that pressures people to narrate and justify themselves just to feel real.",
    ]);
  }

  return (
    cleanText(fallback) ||
    pickVariant(variationSeed, "pattern-default", [
      "The larger shape here is a tension between direct experience and the reflex to turn experience into interpretation too quickly.",
      "This pattern forms when simplicity is desired but meaning feels compulsory, and the mind starts overworking itself just to stay coherent.",
      "The broader pattern is a mind caught between wanting simplicity and feeling forced to manufacture significance.",
    ])
  );
}

function buildTension({ question, signal, sourceText, fallback, variationSeed }) {
  const source = [question, signal, sourceText].join(" ").toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "tension-bug", [
      "If you stay in diagnostic mode, everything starts looking suspicious. If you relax too soon, you worry the true fault slips past. That is the tension.",
      "The tension sits between vigilance and distortion: search too hard and you manufacture ghosts; stop too soon and you fear the real crack remains hidden.",
      "If you keep searching for the flaw, you may find one. If you stop searching, you fear missing the real break. That is the trap.",
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "tension-absurd", [
      "A playful prompt creates a real pressure point: respond too solemnly and the engine looks hollow; respond too literally and it looks asleep.",
      "The tension here is between flexibility and fraud. The system has to hear the joke without pretending the joke is sacred scripture.",
      "If the system takes nonsense too seriously, it feels fake. If it ignores it completely, it feels deaf. That is the tension.",
    ]);
  }

  if (/\b(try|trying|effort|forced|pressure)\b/.test(source)) {
    return pickVariant(variationSeed, "tension-effort", [
      "Push harder and the signal starts sounding artificial. Pull back too much and everything risks going dim. That is the pressure point.",
      "The tension lives between effort and vanishing: too much force and the thing warps, too little and it seems to disappear entirely.",
      "If you try, it feels forced. If you stop trying, it feels like disappearance. That is the trap.",
    ]);
  }

  return (
    cleanText(fallback) ||
    pickVariant(variationSeed, "tension-default", [
      "The pressure point sits between being present and feeling required to explain why your presence matters.",
      "This tension forms where simple being collides with the reflex to earn or narrate itself.",
      "The tension is between the desire to simply exist and the pressure to justify that existence.",
    ])
  );
}

function buildSignal({ question, sourceText, fallback, variationSeed }) {
  const source = [question, sourceText].join(" ").toLowerCase();

  if (/\b(bug|broken|error|glitch|fix|debug)\b/.test(source)) {
    return pickVariant(variationSeed, "signal-bug", [
      "The strongest signal is diagnostic hunger: the drive to determine whether the problem belongs to the machine, the framing, or the mind examining it.",
      "What is actually lighting up here is not only the suspected fault. It is the deeper uncertainty about whether the break lives in the build, the interpretation, or the demand placed on it.",
      "The real signal is not just the bug itself. It is your need to know whether the flaw is in the system, the lens, or the expectation you brought to it.",
    ]);
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return pickVariant(variationSeed, "signal-absurd", [
      "What is being tested here is range. The playful input is asking whether the engine can hear absurdity without collapsing into empty seriousness.",
      "The real signal is mischievous but honest: when meaning is forced to pass through nonsense, does anything genuine still come through?",
      "The signal is a playful challenge: can symbolic meaning survive nonsense, or does the machine just fake coherence?",
    ]);
  }

  if (
    /\b(tired|burnout|burned out|nothing left|void|brutal|so tired|exhausted)\b/.test(
      source
    )
  ) {
    return pickVariant(variationSeed, "signal-exhausted", [
      "What is surfacing is not failure of will. It is fatigue from living too long inside a system that keeps asking expression to justify itself.",
      "The signal is depletion, but not emptiness. It is the weariness that comes from being asked to prove meaning one time too many.",
      "The real signal here is not laziness. It is exhaustion with having to constantly perform value.",
    ]);
  }

  if (/\b(value|valuable|worth|impressive|prove)\b/.test(source)) {
    return pickVariant(variationSeed, "signal-value", [
      "What is being revealed is a quiet exhaustion with needing to demonstrate value before basic presence feels permitted.",
      "The signal here is not lack of ambition. It is resistance to the idea that worth must always arrive with evidence attached.",
      "The signal is a deep fatigue with proving worth instead of being allowed to simply exist.",
    ]);
  }

  return (
    cleanText(fallback) ||
    pickVariant(variationSeed, "signal-default", [
      "What’s coming through is friction between genuine inner signal and the impulse to immediately convert it into function, explanation, or product.",
      "The clearest signal is not confusion but compression: an honest feeling being pressed toward usefulness before it has finished becoming itself.",
      "The signal is a pressure point between honest feeling and the demand to turn that feeling into something useful.",
    ])
  );
}

function buildCoreCardDescription({ cardName, imagePrompt }) {
  if (cardName === "The Exhausted Signal") {
    return cleanText(`A lone figure stands waist-deep in dark still water.
Above them hover dim symbols, expectations, and watching forms.
They are not drowning.
They are exhausted from holding themselves upright long enough to be seen.`);
  }

  if (cardName === "The Fault in the Pattern") {
    return cleanText(`A watcher leans toward a glowing fracture in the symbolic field.
The break is real, but so is the mind that keeps searching for it.
The card asks whether the flaw is in the structure, the expectation, or the timing.`);
  }

  if (cardName === "The Trickster Prompt") {
    return cleanText(`A playful signal enters the ritual space carrying nonsense on purpose.
What survives the joke reveals what the system can actually hear.
The card is not mocking meaning. It is testing its range.`);
  }

  return cleanText(
    imagePrompt ||
      "A solitary symbolic figure stands within a restrained surreal scene, carrying visible emotional tension without chaos."
  );
}

function buildOpening(cardName = "The Witness Under Pressure") {
  return `You have drawn the “${cardName}” card`;
}

function buildCastSections({
  cardName,
  question,
  sourceText,
  priorSections = [],
}) {
  const fallbackSignal = getSectionContent(priorSections, "signal");
  const fallbackTension = getSectionContent(priorSections, "tension");
  const fallbackPattern = getSectionContent(priorSections, "pattern");
  const fallbackInsight = getSectionContent(priorSections, "insight");
  const fallbackRecommendation = getSectionContent(priorSections, "recommendation");

  const variationSeed = [cardName, question, sourceText].filter(Boolean).join(" :: ");

  const signal = buildSignal({
    question,
    sourceText,
    fallback: fallbackSignal,
    variationSeed,
  });

  const tension = buildTension({
    question,
    signal,
    sourceText,
    fallback: fallbackTension,
    variationSeed,
  });

  const pattern = buildPattern({
    question,
    signal,
    tension,
    sourceText,
    fallback: fallbackPattern,
    variationSeed,
  });

  const poem = buildPoemFromSections({
    question,
    signal,
    tension,
    pattern,
  });

  const insight =
    fallbackInsight ||
    buildInsight({
      question,
      signal,
      tension,
      pattern,
      sourceText,
      variationSeed,
    });

  const tone = inferTone([question, signal, tension, pattern, sourceText].join(" "));

  const recommendation =
    fallbackRecommendation ||
    buildRecommendation({
      question,
      tone,
      signal,
      tension,
      variationSeed,
    });

  const imagePrompt = inferCoreImagePrompt({
    cardName,
    signal,
    tension,
    pattern,
    sourceText,
    question,
  });

  const coreCard = {
    name: cardName,
    description: buildCoreCardDescription({ cardName, imagePrompt }),
    imagePrompt,
  };

  const echo = buildEcho({ question, signal, tension, pattern, sourceText });

  return {
    tone,
    opening: buildOpening(cardName),
    sections: [
      { type: "signal", title: "Signal", content: signal },
      { type: "tension", title: "Tension", content: tension },
      { type: "pattern", title: "Pattern", content: pattern },
      { type: "poem", title: "Poem", content: poem },
      { type: "insight", title: "Insight", content: insight },
      {
        type: "recommendation",
        title: "Recommendation",
        content: recommendation,
      },
    ],
    coreCard,
    echo,
  };
}

function tryParseJson(raw = "") {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJsonObject(raw = "") {
  const text = String(raw || "").trim();
  const direct = tryParseJson(text);
  if (direct && typeof direct === "object") return direct;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sliced = text.slice(start, end + 1);
    const parsed = tryParseJson(sliced);
    if (parsed && typeof parsed === "object") return parsed;
  }

  return null;
}

function normalizeModelSections(parsed) {
  const inputSections = Array.isArray(parsed?.sections) ? parsed.sections : [];

  const sectionMap = new Map();

  for (const section of inputSections) {
    const key = normalizeSectionName(section?.type || section?.title || "");
    if (!key) continue;
    sectionMap.set(key, {
      type: key,
      title: titleCase(key),
      content: cleanText(section?.content || ""),
    });
  }

  return Array.from(sectionMap.values());
}

function normalizeCastResponse(parsed = {}, sourceText = "", question = "") {
  const cardName =
    cleanText(parsed?.coreCard?.name || parsed?.cardName || "") ||
    inferCoreCardName([question, sourceText].join(" "));

  const priorSections = normalizeModelSections(parsed);

  const locked = buildCastSections({
    cardName,
    question,
    sourceText,
    priorSections,
  });

  const modelEcho = cleanText(parsed?.echo || parsed?.echoText || "");
  const modelImagePrompt = cleanText(parsed?.coreCard?.imagePrompt || "");
  const modelDescription = cleanText(parsed?.coreCard?.description || "");

  return {
    cardName: locked.coreCard.name,
    opening: locked.opening,
    tone: cleanText(parsed?.tone || locked.tone),
    sections: locked.sections,
    coreCard: {
      name: locked.coreCard.name,
      description: modelDescription || locked.coreCard.description,
      imagePrompt: modelImagePrompt || locked.coreCard.imagePrompt,
    },
    echo: modelEcho || locked.echo,
    metadata: {
      lockedFlow: true,
      flowVersion: "eidomancer-v1-locked-cast",
    },
  };
}

export function buildSeed(input = {}) {
  const question = cleanText(input?.question || "");
  const transcript = cleanText(input?.transcript || "");
  const notes = cleanText(input?.notes || "");
  const combined = cleanText([question, transcript, notes].filter(Boolean).join("\n\n"));

  const sentences = sentenceChunks(combined);
  const gist = truncate(sentences.slice(0, 3).join(" "), 420);

  const themes = uniqueLines([
    ...pickShortLines(question, 2),
    ...pickShortLines(transcript, 3),
    ...pickShortLines(notes, 2),
  ]).slice(0, 5);

  return {
    question,
    sourceText: combined,
    gist,
    themes,
    emotionalTone: inferTone(combined),
    suggestedCardName: inferCoreCardName(combined),
  };
}

export async function generateCastFromSeed(seed = {}, options = {}) {
  const question = cleanText(seed?.question || "");
  const sourceText = cleanText(seed?.sourceText || "");
  const fallbackCardName =
    cleanText(seed?.suggestedCardName || "") ||
    inferCoreCardName([question, sourceText].join(" "));

  const responseText = cleanText(
    options?.responseText || options?.rawText || options?.modelText || ""
  );

  const parsed = extractJsonObject(responseText);

  if (parsed) {
    return normalizeCastResponse(parsed, sourceText, question);
  }

  const locked = buildCastSections({
    cardName: fallbackCardName,
    question,
    sourceText,
    priorSections: [],
  });

  return {
    cardName: locked.coreCard.name,
    opening: locked.opening,
    tone: locked.tone,
    sections: locked.sections,
    coreCard: locked.coreCard,
    echo: locked.echo,
    metadata: {
      lockedFlow: true,
      flowVersion: "eidomancer-v1-locked-cast",
      usedFallback: true,
    },
  };
}

export function formatCastForDisplay(cast = {}) {
  const opening = cleanText(cast?.opening || "");
  const sections = Array.isArray(cast?.sections) ? cast.sections : [];
  const coreCardName = cleanText(cast?.coreCard?.name || cast?.cardName || "");
  const coreCardDescription = cleanText(cast?.coreCard?.description || "");
  const echo = cleanText(cast?.echo || "");

  const body = [
    opening,
    ...sections.map((section) =>
      `## ${section?.title || titleCase(section?.type || "")}\n${cleanText(section?.content || "")}`
    ),
    coreCardName
      ? `## Core Card\n**${coreCardName}**\n${coreCardDescription}`
      : "",
    echo ? `## Echo\n${echo}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return cleanText(body);
}