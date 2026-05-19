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
  return sentenceChunks(text).slice(0, maxLines);
}

const SECTION_ALIASES = {
  signal: "signal",
  tension: "tension",
  pattern: "pattern",
  insight: "insight",
  echo: "echo",
  recommendation: "recommendation",
  action: "recommendation",
  guidance: "recommendation",
  next_move: "recommendation",
  nextmove: "recommendation",
};

function normalizeSectionName(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return SECTION_ALIASES[normalized] || normalized;
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

function hasAny(source = "", patterns = []) {
  return patterns.some((pattern) => pattern.test(source));
}

function inferTone(text = "") {
  const source = String(text || "").toLowerCase();

  const heavyHits =
    (source.match(
      /\b(tired|exhausted|burned out|burnout|nihilist|nihilistic|nothing left|done playing|brutal|worthless|void|fatigue|overwhelmed|empty|weak|suffering|lay down|never get back up)\b/g
    ) || []).length;

  const sharpHits =
    (source.match(
      /\b(angry|rage|furious|hate|algorithm|market|pressure|forced|trapped|punish|corrupt|bug|broken|error|failure|wrong|fix|unfair|cruel|control|coercion)\b/g
    ) || []).length;

  const softHits =
    (source.match(
      /\b(hope|gentle|quiet|calm|simple|rest|soft|tender|allow|peace|appreciative)\b/g
    ) || []).length;

  const absurdHits =
    (source.match(
      /\b(how now brown cow|nonsense|random|weird|absurd|playful|joke|lol)\b/g
    ) || []).length;

  if (absurdHits >= 1 && sharpHits >= 1) return "playful-defiant";
  if (heavyHits >= 2 && sharpHits >= 2) return "exhausted-defiant";
  if (heavyHits >= 2) return "exhausted";
  if (sharpHits >= 2) return "defiant";
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
    /\b(exhausted|tired|burnout|burned out|nothing left|void|nihilist|nihilistic|weak|suffering|fatigue)\b/.test(
      source
    )
  ) {
    return "The Exhausted Signal";
  }

  if (/\b(algorithm|market|metrics|performance|perform|value|monetize|money)\b/.test(source)) {
    return "The Measured Self";
  }

  if (/\b(confused|lost|uncertain|drift|adrift|compass|don’t know|don't know)\b/.test(source)) {
    return "The Fading Compass";
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
    return "The Trickster Prompt";
  }

  if (/\b(control|coercion|obedience|righteous|ideology|tyrant|authority)\b/.test(source)) {
    return "The Crown of Borrowed Fire";
  }

  return "The Witness Under Pressure";
}

function extractCoreTension({ question = "", sourceText = "" }) {
  const source = [question, sourceText].filter(Boolean).join(" ").toLowerCase();
  const seed = [question, sourceText].join(" :: ");

  const profiles = [
    {
      key: "builder-exhaustion",
      tests: [
        /\b(build|make|create|finish|app|project|eidomancer|working|ship|launch)\b/,
        /\b(tired|exhausted|burnout|weak|suffering|overwhelmed|avoid|stuck|can't|cannot|don’t know|don't know)\b/,
      ],
      drive: "You want the thing to become real",
      blockage: "your body and attention keep refusing the pace your mind demands",
      behaviorLoop:
        "You gather meaning, then turn it into a mountain, then punish yourself for not climbing it fast enough.",
      hiddenFear:
        "If you slow down, the window closes; if you push harder, you may break the part of you that still wants this.",
    },
    {
      key: "value-performance",
      tests: [
        /\b(value|valuable|worth|prove|impressive|useful|paid|money|monetize|reward|compensated)\b/,
        /\b(seen|recognized|allowed|effort|work|output|content|share)\b/,
      ],
      drive: "You want your effort to count",
      blockage: "the world keeps translating sincerity into performance metrics",
      behaviorLoop:
        "You look for a clean signal of worth, then mistrust it because every signal now looks like a scoreboard.",
      hiddenFear:
        "If nobody responds, it may feel like the work did not matter, even when the work was real.",
    },
    {
      key: "diagnostic-overreach",
      tests: [
        /\b(bug|broken|error|glitch|debug|fix|wrong|issue|crash|fails|failure)\b/,
        /\b(system|file|code|engine|component|render|daily|hook|flow)\b/,
      ],
      drive: "You want to find the true fault",
      blockage: "your pattern-sense starts flagging every rough edge as possible collapse",
      behaviorLoop:
        "You scan for the hidden break until unfinished begins to feel indistinguishable from doomed.",
      hiddenFear:
        "If you stop checking, the real flaw survives; if you keep checking, the whole project becomes a crime scene.",
    },
    {
      key: "meaning-under-measurement",
      tests: [
        /\b(algorithm|youtube|audience|views|likes|metrics|platform|content|thumbnail|tags|share)\b/,
        /\b(real|meaning|sincere|authentic|truth|seen|toy|gimmick)\b/,
      ],
      drive: "You want the work to stay sincere",
      blockage: "distribution keeps pressuring sincerity to dress up as strategy",
      behaviorLoop:
        "You make something honest, then immediately wonder how it will be judged, packaged, titled, cropped, and sold.",
      hiddenFear:
        "The tool could become successful by becoming exactly the kind of hollow thing it was built to resist.",
    },
    {
      key: "ideology-pressure",
      tests: [
        /\b(control|coercion|obedience|authority|tyrant|righteous|ideology|politics|religion|left|right|war|conflict)\b/,
        /\b(fear|unfair|system|power|lie|truth|reality|narrative)\b/,
      ],
      drive: "You want reality named without letting fear hijack the naming",
      blockage: "people keep turning danger into permission for control",
      behaviorLoop:
        "The argument starts with a real problem, then smuggles in domination as if it were the only adult response.",
      hiddenFear:
        "If compassion cannot defend itself, cruelty will keep disguising itself as wisdom.",
    },
    {
      key: "absurd-calibration",
      tests: [
        /\b(how now brown cow|nonsense|absurd|joke|weird|random|playful|lol)\b/,
        /\b(test|prompt|engine|meaning|range|system)\b/,
      ],
      drive: "You want to know whether the system has range",
      blockage: "fake depth can make even nonsense sound profound",
      behaviorLoop:
        "You poke the ritual with a joke to see whether it is alive, rigid, or just pretending.",
      hiddenFear:
        "If the system treats every input as sacred, it is not wise; it is gullible.",
    },
      {
      key: "authenticity-vs-triviality",
      tests: [
        /\b(real|authentic|meaningful|serious)\b/,
        /\b(toy|gimmick|fake|pointless|silly)\b/,
      ],
      drive: "You want the system to feel real and meaningful",
      blockage: "the fear that it may collapse into a gimmick keeps shadowing the work",
      behaviorLoop:
        "You build something sincere, then test whether it still feels alive after it becomes product-shaped.",
      hiddenFear:
        "If the system becomes too polished, it may stop feeling true; if it stays too raw, it may never become usable.",
    },
];

  const match = profiles.find((profile) =>
    profile.tests.every((test) => test.test(source))
  );

  if (match) {
    return {
      ...match,
      summary: `${match.drive}, but ${match.blockage}.`,
    };
  }

  return {
    key: "default-pressure",
    drive: pickVariant(seed, "default-drive", [
      "You want the signal to stay honest",
      "You want the next step to reveal itself without being forced",
      "You want meaning that is useful without becoming fake",
    ]),
    blockage: pickVariant(seed, "default-blockage", [
      "the pressure to interpret it too quickly keeps distorting the shape",
      "the demand to make it useful keeps arriving before the feeling is finished forming",
      "the mind keeps trying to turn uncertainty into a finished object before it is ready",
    ]),
    behaviorLoop: pickVariant(seed, "default-loop", [
      "You reach for clarity, then over-handle the signal until it starts bruising.",
      "You try to respect the feeling, then immediately ask it to justify itself.",
      "You sense something real, then the need to explain it starts competing with the need to hear it.",
    ]),
    hiddenFear: pickVariant(seed, "default-fear", [
      "If you do not name it, it may vanish; if you name it too quickly, you may falsify it.",
      "If this stays vague, it feels useless; if it becomes too polished, it may stop being true.",
      "If you wait, you risk drifting; if you force it, you risk turning signal into theater.",
    ]),
    summary: "You want the signal to stay honest, but the pressure to interpret it too quickly keeps distorting the shape.",
  };
}

function inferCoreImagePrompt({
  cardName,
  signal,
  tension,
  pattern,
  sourceText,
  question,
  coreTension,
}) {
  const text = [cardName, signal, tension, pattern, sourceText, question, coreTension?.key]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(bug|broken|error|glitch|debug|failure|fix|diagnostic)\b/.test(text)) {
    return "A solitary symbolic figure studying a glowing fracture in reality, where a visible crack in the pattern emits dim coded light, tarot card composition, restrained surrealism, single central subject.";
  }

  if (
    /\b(exhausted|tired|burnout|burned out|void|nothing left|holding.*upright|pressure|builder-exhaustion)\b/.test(
      text
    )
  ) {
    return "A lone figure standing waist-deep in dark still water beneath faint glowing symbols and watchful shapes, exhausted from holding themselves upright under invisible pressure, tarot card composition, symbolic, cohesive, single central subject.";
  }

  if (/\b(algorithm|metrics|market|measured|performance|value)\b/.test(text)) {
    return "A solitary figure surrounded by dim floating interface marks and measurement lines, caught between human softness and mechanical judgment, tarot card composition, symbolic, single central subject.";
  }

  if (/\b(control|coercion|obedience|righteous|ideology|authority|crown)\b/.test(text)) {
    return "A solemn figure holding a borrowed crown made of fire and chains, standing between frightened crowds and a cold throne, tarot card composition, symbolic, restrained, single central subject.";
  }

  if (/\b(how now brown cow|absurd|playful|nonsense|joke)\b/.test(text)) {
    return "A symbolic trickster figure in a surreal ritual space where language bends into looping echoes and playful impossible symbols, tarot card composition, cohesive, single central subject.";
  }

  return [
    `${cardName || "An Eidomancer core card"}, tarot card composition`,
    signal ? `central signal: ${signal}` : "",
    tension ? `visible tension: ${tension}` : "",
    pattern ? `environmental pattern: ${pattern}` : "",
    question ? `emotional focus: ${question}` : "",
    "single central symbolic object or figure",
    "restrained surrealism",
    "cohesive, legible, visually distinct from a metronome",
  ]
    .filter(Boolean)
    .join(", ");
}

function buildSignal({ question, sourceText, fallback, variationSeed, coreTension }) {
  if (cleanText(fallback)) return cleanText(fallback);

  const source = [question, sourceText].join(" ").toLowerCase();

  if (coreTension?.key && coreTension.key !== "default-pressure") {
    return pickVariant(variationSeed, `signal-${coreTension.key}`, [
      `The strongest signal is this: ${coreTension.summary} The cast is not reading a mood; it is reading the collision between intent and friction.`,
      `What is actually lighting up is not the surface problem. It is the split between what you are trying to protect and what reality keeps making expensive: ${coreTension.summary}`,
      `The signal is the contradiction itself. ${coreTension.drive}, but ${coreTension.blockage}. That is where the cast begins.`,
    ]);
  }

  if (/\b(tired|burnout|burned out|nothing left|void|brutal|so tired|exhausted|weak)\b/.test(source)) {
    return pickVariant(variationSeed, "signal-exhausted", [
      "What is surfacing is not failure of will. It is fatigue from living too long inside a system that keeps asking expression to justify itself.",
      "The signal is depletion, but not emptiness. It is the weariness that comes from being asked to prove meaning one time too many.",
      "The real signal here is not laziness. It is exhaustion with having to constantly perform value.",
    ]);
  }

  return pickVariant(variationSeed, "signal-default", [
    `The signal is not confusion. It is pressure around an unnamed contradiction: ${coreTension.summary}`,
    `What’s coming through is a real feeling being pushed toward usefulness before it has finished becoming clear. ${coreTension.hiddenFear}`,
    `The clearest signal is compression: something honest is trying to stay intact while the mind asks it to become legible too quickly.`,
  ]);
}

function buildTension({ question, signal, sourceText, fallback, variationSeed, coreTension }) {
  if (cleanText(fallback)) return cleanText(fallback);

  const source = [question, signal, sourceText].join(" ").toLowerCase();

  if (coreTension?.key && coreTension.key !== "default-pressure") {
    return pickVariant(variationSeed, `tension-${coreTension.key}`, [
      `${coreTension.hiddenFear} That is the live wire under the reading.`,
      `The tension is not simply that this is hard. It is that both choices carry a cost: ${coreTension.hiddenFear}`,
      `This is the trap: ${coreTension.behaviorLoop} The problem is not effort. It is effort without a humane governor.`,
    ]);
  }

  if (/\b(try|trying|effort|forced|pressure)\b/.test(source)) {
    return pickVariant(variationSeed, "tension-effort", [
      "Push harder and the signal starts sounding artificial. Pull back too much and everything risks going dim. That is the pressure point.",
      "The tension lives between effort and vanishing: too much force and the thing warps, too little and it seems to disappear entirely.",
      "If you try, it feels forced. If you stop trying, it feels like disappearance. That is the trap.",
    ]);
  }

  return pickVariant(variationSeed, "tension-default", [
    `${coreTension.hiddenFear} That is why the feeling refuses to become simple.`,
    "The pressure point sits between being present and feeling required to explain why your presence matters.",
    "The tension is between the desire to simply exist and the pressure to justify that existence.",
  ]);
}

function buildPattern({ question, signal, tension, sourceText, fallback, variationSeed, coreTension }) {
  if (cleanText(fallback)) return cleanText(fallback);

  const source = [question, signal, tension, sourceText].join(" ").toLowerCase();

  if (coreTension?.key && coreTension.key !== "default-pressure") {
    return pickVariant(variationSeed, `pattern-${coreTension.key}`, [
      `The broader pattern is this loop: ${coreTension.behaviorLoop}`,
      `This is not just a mood. It is a repeatable mechanism: ${coreTension.behaviorLoop}`,
      `The system underneath the feeling is simple and brutal: ${coreTension.behaviorLoop}`,
    ]);
  }

  if (/\b(algorithm|market|metrics|youtube|audience)\b/.test(source)) {
    return pickVariant(variationSeed, "pattern-algorithm", [
      "The broader pattern is systemic: once measurement sits between the self and expression, sincerity begins mutating into strategy.",
      "What you are touching is not just personal. It is the cultural pressure that turns identity into output and output into proof of value.",
      "This is bigger than one mood. It is what happens when modern life puts metrics between expression and worth, until even authenticity starts to feel like a performance.",
    ]);
  }

  return pickVariant(variationSeed, "pattern-default", [
    coreTension.behaviorLoop,
    "The larger shape here is a tension between direct experience and the reflex to turn experience into interpretation too quickly.",
    "The broader pattern is a mind caught between wanting simplicity and feeling forced to manufacture significance.",
  ]);
}

function buildPoemFromSections({ question = "", signal, tension, pattern, coreTension }) {
  const source = [question, signal, tension, pattern, coreTension?.key]
    .join(" ")
    .toLowerCase();
  const variationSeed = [question, signal, tension, pattern].join(" :: ");

  if (/\b(diagnostic-overreach|bug|broken|error|glitch|fix|debug)\b/.test(source)) {
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

  if (/\b(absurd-calibration|how now brown cow|absurd|playful|nonsense|joke)\b/.test(source)) {
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

  if (/\b(builder-exhaustion|exhausted|tired|burnout|burned out|nothing left|overwhelmed|fatigue)\b/.test(source)) {
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

  if (/\b(value-performance|value|worth|prove|performance|perform|impressive)\b/.test(source)) {
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

  if (/\b(ideology-pressure|control|coercion|obedience|righteous)\b/.test(source)) {
    return pickVariant(variationSeed, "poem-ideology", [
      cleanText(`Fear found a crown
and called itself wisdom

the crowd heard thunder

and mistook volume
for truth`),

      cleanText(`A real danger
stood at the gate

then someone sold the key

as if obedience
were shelter`),

      cleanText(`The old spell returns

name the wound
claim the cure
own the hand
that tightens`),
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

function buildInsight({ question, signal, tension, pattern, sourceText, variationSeed, coreTension }) {
  const source = [question, signal, tension, pattern, sourceText, coreTension?.key]
    .join(" ")
    .toLowerCase();

  if (coreTension?.key && coreTension.key !== "default-pressure") {
    return pickVariant(variationSeed, `insight-${coreTension.key}`, [
      `The useful truth is uncomfortable: ${coreTension.hiddenFear} The answer is not to pretend the fear is false. The answer is to stop letting it run the whole machine.`,
      `This cast is pointing at a behavior loop, not a flaw in character. ${coreTension.behaviorLoop} Once named, the loop becomes something you can interrupt.`,
      `The pressure makes sense, but pressure is not always instruction. ${coreTension.summary} That distinction matters.`,
    ]);
  }

  if (/\b(value|valuable|worth|prove|performance|perform)\b/.test(source)) {
    return pickVariant(variationSeed, "insight-value", [
      "You were trained to believe value must be demonstrated to exist. That is why even simple self-expression feels like a test.",
      "The pressure to prove worth rewires expression into audition. Once that happens, even honest feeling starts to sound like a performance review.",
      "When worth becomes something to demonstrate, being yourself starts to feel insufficient by default. That distortion is doing more damage than it first appears.",
    ]);
  }

  return pickVariant(variationSeed, "insight-default", [
    "The conflict is usually not between depth and simplicity, but between being and being evaluated.",
    "The friction here is less about meaning itself and more about what happens when meaning feels observed, measured, or prematurely interpreted.",
    "What looks like confusion is often a collision between genuine signal and the pressure to convert it into something legible too quickly.",
  ]);
}

function buildRecommendation({ question, tone, signal, tension, variationSeed, coreTension }) {
  const source = [question, tone, signal, tension, coreTension?.key].join(" ").toLowerCase();

  if (coreTension?.key === "builder-exhaustion") {
    return pickVariant(variationSeed, "recommendation-builder-exhaustion", [
      "Make the next task smaller than your pride wants it to be. One file, one visible improvement, then stop.",
      "Do not ask whether the whole project is possible today. Pick one seam and make it less broken.",
      "Protect the spark by reducing the demand. The goal is not heroic output; it is continuity.",
    ]);
  }

  if (coreTension?.key === "value-performance") {
    return pickVariant(variationSeed, "recommendation-value-performance", [
      "Create one thing before checking whether it deserves attention.",
      "Separate worth from response for one cycle. Make the artifact, then evaluate distribution later.",
      "Do one honest action that does not need applause to have happened.",
    ]);
  }

  if (coreTension?.key === "diagnostic-overreach") {
    return pickVariant(variationSeed, "recommendation-diagnostic-overreach", [
      "Pick one suspected fault and test only that. Ignore every other weird edge until you know whether this one reproduces.",
      "Reduce the scope. One bug, one test, one result. Do not diagnose the whole machine at once.",
      "Write down the smallest concrete break you can name, then test it in isolation before you interpret the rest of the system.",
    ]);
  }

  if (coreTension?.key === "meaning-under-measurement") {
    return pickVariant(variationSeed, "recommendation-meaning-under-measurement", [
      "Make the honest version first. Package it after it exists.",
      "Keep the platform out of the first draft. Let the signal form before the scoreboard enters.",
      "Separate expression from distribution for one cycle. Build it, then judge it later.",
    ]);
  }

  if (coreTension?.key === "ideology-pressure") {
    return pickVariant(variationSeed, "recommendation-ideology-pressure", [
      "Name the real danger without granting ownership of the cure to the loudest person in the room.",
      "Look for the bridge between fear and obedience. That is usually where the trick is hidden.",
      "Ask who benefits when urgency is used to make cruelty sound mature.",
    ]);
  }

  if (coreTension?.key === "absurd-calibration") {
    return pickVariant(variationSeed, "recommendation-absurd-calibration", [
      "Run one absurd prompt and one serious prompt back to back. Compare what changes and what stays stable.",
      "Treat play as a test harness. Try one ridiculous prompt, then one sincere one, and compare the symbolic range.",
      "Use this as calibration. The system should bend without becoming fake-deep.",
    ]);
  }

  if (/\b(exhausted|burnout|nothing left|tired)\b/.test(source)) {
    return pickVariant(variationSeed, "recommendation-exhausted", [
      "Do one thing today that does not need to be shared, improved, or justified.",
      "Reduce the demand. Pick one task and make it smaller before you try to finish it.",
      "Protect ten minutes of non-performative time. No posting, no optimizing, no proving.",
    ]);
  }

  return pickVariant(variationSeed, "recommendation-default", [
    "Name one true thing about today without trying to improve it yet.",
    "Take one small action that clarifies the signal instead of expanding the story.",
    "Choose the smallest next move that makes tomorrow easier to read.",
  ]);
}

function buildEcho({ question, signal, tension, pattern, sourceText, coreTension }) {
  const source = [question, signal, tension, pattern, sourceText, coreTension?.key]
    .join(" ")
    .toLowerCase();

  const seeded = [question, signal, tension, pattern, sourceText].join(" :: ");

  const byProfile = {
    "builder-exhaustion": [
      "The dream is not dead. It is overloaded.",
      "You are not out of meaning. You are out of humane pacing.",
      "The mountain got built out of next steps.",
    ],
    "value-performance": [
      "I don’t want to be impressive. I want to be allowed.",
      "Worth is not a scoreboard, even when the world acts like one.",
      "The work mattered before the metric saw it.",
    ],
    "diagnostic-overreach": [
      "The bug may be real, but so is the lens looking for it.",
      "Not every rough edge is the fatal flaw.",
      "Debug the machine, not your right to build it.",
    ],
    "meaning-under-measurement": [
      "The system taught you to perform your own existence.",
      "Make the signal before the scoreboard arrives.",
      "Authenticity starts mutating when metrics enter too early.",
    ],
    "ideology-pressure": [
      "Fear is not proof that obedience is wisdom.",
      "The trick is turning danger into ownership of the cure.",
      "Cruelty loves to borrow reality’s voice.",
    ],
    "absurd-calibration": [
      "Sometimes the test is whether meaning survives nonsense.",
      "A joke can expose a fake oracle.",
      "If the ritual cannot laugh, it cannot listen.",
    ],
  };

  if (coreTension?.key && byProfile[coreTension.key]) {
    return pickVariant(seeded, `echo-${coreTension.key}`, byProfile[coreTension.key]);
  }

  if (/\b(exhausted|tired|burnout|nothing left)\b/.test(source)) {
    return "You’re not broken. You’re over-optimized.";
  }

  if (/\b(algorithm|market|metrics)\b/.test(source)) {
    return "The system taught you to perform your own existence.";
  }

  return "Meaning arrives best when it is not forced.";
}

function buildCoreCardDescription({ cardName, imagePrompt, coreTension }) {
  if (coreTension?.key && coreTension.key !== "default-pressure") {
    return cleanText(`${coreTension.summary}

${coreTension.behaviorLoop}

The card does not accuse. It names the pressure so it can stop pretending to be fate.`);
  }

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

function buildCoreCardLore({
  cardName,
  description,
  imagePrompt,
  echo,
  question,
  coreTension,
}) {
  const focus = cleanText(question);
  const symbolicImage = cleanText(imagePrompt);
  const namedPressure =
    coreTension?.summary ||
    "This card names the pressure pattern moving under the surface of the day.";
  const behaviorLoop =
    coreTension?.behaviorLoop ||
    "It appears when attention, expectation, and meaning begin to pull against each other.";

  return {
    archetypeMeaning: cleanText(
      description ||
        `${cardName} is an archetype of attention under pressure: a symbolic anchor for the moment when an inner pattern becomes visible enough to work with.`
    ),
    symbolicRole: cleanText(
      symbolicImage
        ? `Its symbolic role is carried by the image: ${symbolicImage}`
        : `${cardName} serves as the day's primary symbolic anchor.`
    ),
    uprightMeaning: cleanText(
      `${namedPressure} Read upright, it asks the Caster to treat the signal as information rather than identity.`
    ),
    shadowMeaning: cleanText(
      `${behaviorLoop} In shadow, the card can become fixation: mistaking the pattern for the whole self.`
    ),
    whyItAppeared: cleanText(
      focus
        ? `It appeared because the focus "${focus}" touched the same pressure this card is built to reveal.`
        : "It appeared as the daily field's strongest available symbolic anchor."
    ),
    casterInvitation: cleanText(
      echo || "Let the symbol clarify the next movement without forcing the entire story to resolve."
    ),
  };
}

function pickVisualPalette(source = "") {
  const text = cleanText(source).toLowerCase();

  if (/\b(exhaust|tired|burnout|fatigue|drain)\b/.test(text)) {
    return "deep blue, cold cyan, ash white, muted silver";
  }

  if (/\b(pattern|loop|cycle|system|algorithm|metric)\b/.test(text)) {
    return "blue black, electric cyan, violet, glass green";
  }

  if (/\b(trick|joke|absurd|paradox|play)\b/.test(text)) {
    return "black violet, fuchsia, amber, teal";
  }

  if (/\b(shadow|fear|threat|conflict|pressure)\b/.test(text)) {
    return "blackened crimson, ember orange, dim gold, bruised blue";
  }

  return "deep blue, luminous cyan, ritual amber, violet shadow";
}

function buildCoreCardVisual({
  cardName,
  description,
  imagePrompt,
  lore,
  question,
  signal,
  tension,
  pattern,
  insight,
  echo,
  coreTension,
}) {
  const source = [
    cardName,
    question,
    description,
    imagePrompt,
    lore?.archetypeMeaning,
    lore?.symbolicRole,
    lore?.shadowMeaning,
    signal,
    tension,
    pattern,
    insight,
    echo,
    coreTension?.key,
  ]
    .filter(Boolean)
    .join(" :: ");
  const seed = hashString(source);
  const subject =
    imagePrompt ||
    description ||
    `${cardName} embodied as a single symbolic figure in an Eidomancer ritual field`;
  const archetypeFigure = pickVariant(seed, "visual-figure", [
    "solitary witness",
    "threshold keeper",
    "signal bearer",
    "pattern reader",
    "shadow cartographer",
  ]);
  const primaryMotif = pickVariant(seed, "visual-primary", [
    "luminous signal",
    "fractured halo",
    "ritual aperture",
    "coded thread",
    "suspended symbolic object",
  ]);
  const secondaryMotifs = [
    pickVariant(seed, "visual-secondary-a", [
      "thin orbit lines",
      "dim glyph field",
      "soft circuit roots",
      "broken reflection marks",
      "watching light points",
    ]),
    pickVariant(seed, "visual-secondary-b", [
      "distant threshold",
      "pressure rings",
      "weathered sigils",
      "faint measurement grid",
      "echo traces",
    ]),
  ];
  const paletteHint = pickVisualPalette(source);
  const lighting = pickVariant(seed, "visual-lighting", [
    "low ritual glow from below",
    "cold side light with a warm symbolic core",
    "backlit silhouette against a luminous field",
    "soft cyan radiance with amber edge light",
  ]);
  const atmosphere = pickVariant(seed, "visual-atmosphere", [
    "quiet, charged, and watchful",
    "ancient digital, restrained, and tense",
    "liminal, weathered, and symbolically dense",
    "calm on the surface with visible pressure underneath",
  ]);
  const environment = pickVariant(seed, "visual-environment", [
    "a dark ritual chamber made of glass, water, and signal noise",
    "a suspended symbolic landscape with distant threshold architecture",
    "a black-blue codex space where light behaves like weather",
    "a surreal field of glyphs, roots, and measured shadow",
  ]);
  const composition = pickVariant(seed, "visual-composition", [
    "portrait tarot composition, one central figure, clear silhouette",
    "central subject framed by orbiting motifs and a deep background field",
    "single symbolic anchor in the foreground, atmosphere expanding behind it",
    "vertical icon composition with readable negative space",
  ]);

  return {
    subject,
    archetypeFigure,
    environment,
    primaryMotif,
    secondaryMotifs,
    paletteHint,
    lighting,
    atmosphere,
    composition,
    symbolicProps: [
      primaryMotif,
      ...secondaryMotifs,
      coreTension?.key ? `${coreTension.key} pressure marker` : "daily pressure marker",
    ],
    imagePrompt: cleanText(
      [
        subject,
        `archetype figure: ${archetypeFigure}`,
        `environment: ${environment}`,
        `primary motif: ${primaryMotif}`,
        `secondary motifs: ${secondaryMotifs.join(", ")}`,
        `palette: ${paletteHint}`,
        `lighting: ${lighting}`,
        `atmosphere: ${atmosphere}`,
        composition,
      ].join("; ")
    ),
  };
}

function buildCoreCardImageGeneration({
  cardName,
  visual = {},
  lore = {},
  question = "",
  themeId = "emergent",
}) {
  const palette =
    cleanText(visual.paletteHint) ||
    pickVisualPalette(
      [
        cardName,
        question,
        lore.archetypeMeaning,
        lore.shadowMeaning,
        visual.atmosphere,
        visual.primaryMotif,
      ]
        .filter(Boolean)
        .join(" ")
    );
  const symbolicMotifs = [
    visual.primaryMotif,
    ...(Array.isArray(visual.secondaryMotifs) ? visual.secondaryMotifs : []),
    ...(Array.isArray(visual.symbolicProps) ? visual.symbolicProps.slice(0, 2) : []),
  ]
    .map(cleanText)
    .filter(Boolean);
  const subject =
    cleanText(visual.subject) ||
    cleanText(lore.archetypeMeaning) ||
    `${cardName} as a symbolic archetype figure`;
  const setting =
    cleanText(visual.environment) ||
    cleanText(lore.symbolicRole) ||
    "an ancient digital ritual field";
  const mood =
    cleanText(visual.atmosphere) ||
    cleanText(lore.shadowMeaning) ||
    "quiet, charged, and symbolically dense";
  const lighting = cleanText(visual.lighting) || "luminous cyan and amber ritual light";
  const composition =
    cleanText(visual.composition) ||
    "portrait tarot card composition, one central figure, readable silhouette";

  return {
    prompt: cleanText(
      [
        `Create a tarot-style Core Card image for "${cardName}".`,
        `Subject: ${subject}.`,
        `Setting: ${setting}.`,
        symbolicMotifs.length
          ? `Symbolic motifs: ${symbolicMotifs.join(", ")}.`
          : "",
        `Palette: ${palette}.`,
        `Lighting: ${lighting}.`,
        `Mood: ${mood}.`,
        `Composition: ${composition}.`,
        "The image should feel like a single symbolic card illustration, not a full environmental artifact scene.",
      ]
        .filter(Boolean)
        .join(" ")
    ),
    negativePrompt:
      "no readable text, no UI, no dashboard panels, no logo, no watermark, no photorealistic celebrity, no cluttered collage, no full artifact/world scene",
    aspectRatio: "2:3",
    styleFamily: "tarot-core-card",
    themeId,
    palette,
    subject,
    setting,
    symbolicMotifs,
    composition,
    mood,
    lighting,
    textPolicy: "Do not render readable text inside the image; the app overlays titles separately.",
    safetyNotes:
      "Symbolic, non-literal archetypal imagery only; avoid depicting real private people or graphic harm.",
  };
}

function buildOpening(cardName = "The Witness Under Pressure") {
  return `You have drawn the “${cardName}” card`;
}

function buildCastSections({
  cardName,
  question,
  sourceText,
  priorSections = [],
  coreTension,
}) {
  const fallbackSignal = getSectionContent(priorSections, "signal");
  const fallbackTension = getSectionContent(priorSections, "tension");
  const fallbackPattern = getSectionContent(priorSections, "pattern");
  const fallbackInsight = getSectionContent(priorSections, "insight");
  const fallbackRecommendation = getSectionContent(priorSections, "recommendation");

  const variationSeed = [cardName, question, sourceText, coreTension?.key]
    .filter(Boolean)
    .join(" :: ");

  const signal = buildSignal({
    question,
    sourceText,
    fallback: fallbackSignal,
    variationSeed,
    coreTension,
  });

  const tension = buildTension({
    question,
    signal,
    sourceText,
    fallback: fallbackTension,
    variationSeed,
    coreTension,
  });

  const pattern = buildPattern({
    question,
    signal,
    tension,
    sourceText,
    fallback: fallbackPattern,
    variationSeed,
    coreTension,
  });

  const poem = buildPoemFromSections({
    question,
    signal,
    tension,
    pattern,
    coreTension,
  });

  const tone = inferTone([question, signal, tension, pattern, sourceText].join(" "));

  const insight =
    fallbackInsight ||
    buildInsight({
      question,
      signal,
      tension,
      pattern,
      sourceText,
      variationSeed,
      coreTension,
    });

  const recommendation =
    fallbackRecommendation ||
    buildRecommendation({
      question,
      tone,
      signal,
      tension,
      variationSeed,
      coreTension,
    });

  const imagePrompt = inferCoreImagePrompt({
    cardName,
    signal,
    tension,
    pattern,
    sourceText,
    question,
    coreTension,
  });

  const echo = buildEcho({
    question,
    signal,
    tension,
    pattern,
    sourceText,
    coreTension,
  });

  const coreCardDescription = buildCoreCardDescription({
    cardName,
    imagePrompt,
    coreTension,
  });

  const coreCardLore = buildCoreCardLore({
    cardName,
    description: coreCardDescription,
    imagePrompt,
    echo,
    question,
    coreTension,
  });
  const coreCardVisual = buildCoreCardVisual({
    cardName,
    description: coreCardDescription,
    imagePrompt,
    lore: coreCardLore,
    question,
    signal,
    tension,
    pattern,
    insight,
    echo,
    coreTension,
  });

  const coreCard = {
    name: cardName,
    description: coreCardDescription,
    imagePrompt,
    lore: coreCardLore,
    visual: coreCardVisual,
    imageGeneration: buildCoreCardImageGeneration({
      cardName,
      visual: coreCardVisual,
      lore: coreCardLore,
      question,
    }),
  };

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
  const sectionMap = new Map();
  const allowedTypes = new Set([
    "signal",
    "tension",
    "pattern",
    "insight",
    "recommendation",
    "echo",
  ]);

  function readSectionContent(value) {
    if (typeof value === "string") return cleanText(value);
    if (!value || typeof value !== "object") return "";

    return cleanText(
      value.content || value.body || value.text || value.value || ""
    );
  }

  function addSection(type, value) {
    const key = normalizeSectionName(type);
    const content = readSectionContent(value);

    if (!allowedTypes.has(key) || !content) return;

    sectionMap.set(key, {
      type: key,
      title: titleCase(key),
      content,
    });
  }

  const inputSections = Array.isArray(parsed?.sections) ? parsed.sections : [];

  for (const section of inputSections) {
    addSection(section?.type || section?.title || "", section);
  }

  if (parsed && typeof parsed === "object") {
    for (const [key, value] of Object.entries(parsed)) {
      addSection(key, value);
    }
  }

  return Array.from(sectionMap.values());
}

function getModelCoreCard(parsed = {}) {
  const coreCard =
    parsed?.coreCard && typeof parsed.coreCard === "object"
      ? parsed.coreCard
      : parsed?.core_card && typeof parsed.core_card === "object"
      ? parsed.core_card
      : {};

  const loreSource =
    coreCard.lore && typeof coreCard.lore === "object"
      ? coreCard.lore
      : coreCard.meaning && typeof coreCard.meaning === "object"
      ? coreCard.meaning
      : {};
  const visualSource =
    coreCard.visual && typeof coreCard.visual === "object"
      ? coreCard.visual
      : coreCard.visualIdentity && typeof coreCard.visualIdentity === "object"
      ? coreCard.visualIdentity
      : coreCard.visual_identity && typeof coreCard.visual_identity === "object"
      ? coreCard.visual_identity
      : {};
  const imageGenerationSource =
    coreCard.imageGeneration && typeof coreCard.imageGeneration === "object"
      ? coreCard.imageGeneration
      : coreCard.image_generation && typeof coreCard.image_generation === "object"
      ? coreCard.image_generation
      : {};

  return {
    name: cleanText(
      coreCard.name ||
        coreCard.title ||
        parsed?.cardName ||
        parsed?.card_name ||
        parsed?.card ||
        parsed?.title ||
        ""
    ),
    description: cleanText(
      coreCard.description ||
        coreCard.coreObject ||
        coreCard.core_object ||
        parsed?.coreObject ||
        parsed?.core_object ||
        ""
    ),
    imagePrompt: cleanText(
      coreCard.imagePrompt ||
        coreCard.image_prompt ||
        parsed?.imagePrompt ||
        parsed?.image_prompt ||
        ""
    ),
    lore: {
      archetypeMeaning: cleanText(
        loreSource.archetypeMeaning ||
          loreSource.archetype_meaning ||
          loreSource.meaning ||
          loreSource.archetype ||
          ""
      ),
      symbolicRole: cleanText(
        loreSource.symbolicRole ||
          loreSource.symbolic_role ||
          loreSource.role ||
          ""
      ),
      uprightMeaning: cleanText(
        loreSource.uprightMeaning ||
          loreSource.upright_meaning ||
          loreSource.upright ||
          ""
      ),
      shadowMeaning: cleanText(
        loreSource.shadowMeaning ||
          loreSource.shadow_meaning ||
          loreSource.shadow ||
          ""
      ),
      whyItAppeared: cleanText(
        loreSource.whyItAppeared ||
          loreSource.why_it_appeared ||
          loreSource.appearance ||
          ""
      ),
      casterInvitation: cleanText(
        loreSource.casterInvitation ||
          loreSource.caster_invitation ||
          loreSource.invitation ||
          loreSource.ask ||
          ""
      ),
    },
    visual: {
      subject: cleanText(visualSource.subject || ""),
      archetypeFigure: cleanText(
        visualSource.archetypeFigure || visualSource.archetype_figure || ""
      ),
      environment: cleanText(visualSource.environment || ""),
      primaryMotif: cleanText(
        visualSource.primaryMotif || visualSource.primary_motif || ""
      ),
      secondaryMotifs: Array.isArray(visualSource.secondaryMotifs)
        ? visualSource.secondaryMotifs.map(cleanText).filter(Boolean)
        : Array.isArray(visualSource.secondary_motifs)
        ? visualSource.secondary_motifs.map(cleanText).filter(Boolean)
        : [],
      paletteHint: cleanText(
        visualSource.paletteHint || visualSource.palette_hint || ""
      ),
      lighting: cleanText(visualSource.lighting || ""),
      atmosphere: cleanText(visualSource.atmosphere || ""),
      composition: cleanText(visualSource.composition || ""),
      symbolicProps: Array.isArray(visualSource.symbolicProps)
        ? visualSource.symbolicProps.map(cleanText).filter(Boolean)
        : Array.isArray(visualSource.symbolic_props)
        ? visualSource.symbolic_props.map(cleanText).filter(Boolean)
        : [],
      imagePrompt: cleanText(
        visualSource.imagePrompt || visualSource.image_prompt || ""
      ),
    },
    imageGeneration: {
      prompt: cleanText(imageGenerationSource.prompt || ""),
      negativePrompt: cleanText(
        imageGenerationSource.negativePrompt ||
          imageGenerationSource.negative_prompt ||
          ""
      ),
      aspectRatio: cleanText(
        imageGenerationSource.aspectRatio ||
          imageGenerationSource.aspect_ratio ||
          ""
      ),
      styleFamily: cleanText(
        imageGenerationSource.styleFamily ||
          imageGenerationSource.style_family ||
          ""
      ),
      themeId: cleanText(
        imageGenerationSource.themeId || imageGenerationSource.theme_id || ""
      ),
      palette: cleanText(imageGenerationSource.palette || ""),
      subject: cleanText(imageGenerationSource.subject || ""),
      setting: cleanText(imageGenerationSource.setting || ""),
      symbolicMotifs: Array.isArray(imageGenerationSource.symbolicMotifs)
        ? imageGenerationSource.symbolicMotifs.map(cleanText).filter(Boolean)
        : Array.isArray(imageGenerationSource.symbolic_motifs)
        ? imageGenerationSource.symbolic_motifs.map(cleanText).filter(Boolean)
        : [],
      composition: cleanText(imageGenerationSource.composition || ""),
      mood: cleanText(imageGenerationSource.mood || ""),
      lighting: cleanText(imageGenerationSource.lighting || ""),
      textPolicy: cleanText(
        imageGenerationSource.textPolicy ||
          imageGenerationSource.text_policy ||
          ""
      ),
      safetyNotes: cleanText(
        imageGenerationSource.safetyNotes ||
          imageGenerationSource.safety_notes ||
          ""
      ),
    },
  };
}

function normalizeCastResponse(parsed = {}, sourceText = "", question = "") {
  const coreTension = extractCoreTension({ question, sourceText });
  const modelCoreCard = getModelCoreCard(parsed);

  const cardName =
    modelCoreCard.name ||
    inferCoreCardName([question, sourceText, coreTension?.key].join(" "));

  const priorSections = normalizeModelSections(parsed);

  const locked = buildCastSections({
    cardName,
    question,
    sourceText,
    priorSections,
    coreTension,
  });

  const modelEcho = cleanText(
    parsed?.echo || parsed?.echoText || getSectionContent(priorSections, "echo")
  );
  const mergedCoreCardDescription =
    modelCoreCard.description || locked.coreCard.description;
  const mergedImagePrompt = modelCoreCard.imagePrompt || locked.coreCard.imagePrompt;
  const modelLore = Object.fromEntries(
    Object.entries(modelCoreCard.lore || {}).filter(([, value]) => value)
  );
  const modelVisual = Object.fromEntries(
    Object.entries(modelCoreCard.visual || {}).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    )
  );
  const modelImageGeneration = Object.fromEntries(
    Object.entries(modelCoreCard.imageGeneration || {}).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    )
  );
  const coreCardLore = {
    ...locked.coreCard.lore,
    ...buildCoreCardLore({
      cardName: locked.coreCard.name,
      description: mergedCoreCardDescription,
      imagePrompt: mergedImagePrompt,
      echo: modelEcho || locked.echo,
      question,
      coreTension,
    }),
    ...modelLore,
  };
  const coreCardVisual = {
    ...locked.coreCard.visual,
    ...buildCoreCardVisual({
      cardName: locked.coreCard.name,
      description: mergedCoreCardDescription,
      imagePrompt: mergedImagePrompt,
      lore: coreCardLore,
      question,
      signal: getSectionContent(locked.sections, "signal"),
      tension: getSectionContent(locked.sections, "tension"),
      pattern: getSectionContent(locked.sections, "pattern"),
      insight: getSectionContent(locked.sections, "insight"),
      echo: modelEcho || locked.echo,
      coreTension,
    }),
    ...modelVisual,
  };
  const coreCardImageGeneration = {
    ...buildCoreCardImageGeneration({
      cardName: locked.coreCard.name,
      visual: coreCardVisual,
      lore: coreCardLore,
      question,
    }),
    ...modelImageGeneration,
  };
  const usedModelSectionTypes = priorSections.map((section) => section.type);
  const fallbackSectionTypes = locked.sections
    .map((section) => section.type)
    .filter((type) => !usedModelSectionTypes.includes(type));
  const usedModelFields = [
    modelCoreCard.name ? "cardName" : "",
    modelCoreCard.description ? "coreCard.description" : "",
    modelCoreCard.imagePrompt ? "coreCard.imagePrompt" : "",
    Object.keys(modelLore).length > 0 ? "coreCard.lore" : "",
    Object.keys(modelVisual).length > 0 ? "coreCard.visual" : "",
    Object.keys(modelImageGeneration).length > 0
      ? "coreCard.imageGeneration"
      : "",
    modelEcho ? "echo" : "",
  ].filter(Boolean);

  return {
    cardName: locked.coreCard.name,
    opening: locked.opening,
    tone: cleanText(parsed?.tone || locked.tone),
    sections: locked.sections,
    coreCard: {
      name: locked.coreCard.name,
      description: mergedCoreCardDescription,
      imagePrompt: mergedImagePrompt,
      lore: coreCardLore,
      visual: coreCardVisual,
      imageGeneration: coreCardImageGeneration,
    },
    echo: modelEcho || locked.echo,
    metadata: {
      lockedFlow: true,
      flowVersion: "eidomancer-v1-tension-extraction",
      coreTensionKey: coreTension?.key || "default-pressure",
      usedModelSections: usedModelSectionTypes,
      usedModelFields,
      fallbackSections: fallbackSectionTypes,
      usedFallback:
        usedModelSectionTypes.length === 0 && usedModelFields.length === 0,
    },
  };
}

export function buildSeed(input = {}) {
  const question = cleanText(input?.question || "");
  const transcript = cleanText(input?.transcript || "");
  const notes = cleanText(input?.notes || "");
  const sourceText = cleanText(input?.sourceText || "");
  const userContext = cleanText(input?.userContext || "");

  const combined = cleanText(
    [question, transcript, notes, sourceText, userContext].filter(Boolean).join("\n\n")
  );

  const coreTension = extractCoreTension({ question, sourceText: combined });
  const sentences = sentenceChunks(combined);
  const gist = truncate(sentences.slice(0, 3).join(" "), 420);

  const themes = uniqueLines([
    coreTension.summary,
    coreTension.behaviorLoop,
    ...pickShortLines(question, 2),
    ...pickShortLines(transcript || sourceText, 3),
    ...pickShortLines(notes || userContext, 2),
  ]).slice(0, 6);

  return {
    question,
    sourceText: combined,
    gist,
    themes,
    emotionalTone: inferTone(combined),
    suggestedCardName: inferCoreCardName([combined, coreTension.key].join(" ")),
    coreTension,
  };
}

export async function generateCastFromSeed(seed = {}, options = {}) {
  const question = cleanText(seed?.question || "");
  const sourceText = cleanText(seed?.sourceText || "");
  const coreTension =
    seed?.coreTension && typeof seed.coreTension === "object"
      ? seed.coreTension
      : extractCoreTension({ question, sourceText });

  const fallbackCardName =
    cleanText(seed?.suggestedCardName || "") ||
    inferCoreCardName([question, sourceText, coreTension?.key].join(" "));

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
    coreTension,
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
      flowVersion: "eidomancer-v1-tension-extraction",
      usedFallback: true,
      coreTensionKey: coreTension?.key || "default-pressure",
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
      `## ${section?.title || titleCase(section?.type || "")}\n${cleanText(
        section?.content || ""
      )}`
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
