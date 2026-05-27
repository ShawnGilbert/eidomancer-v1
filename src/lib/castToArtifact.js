const GENERIC_LABELS = new Set([
  "signal",
  "tension",
  "pattern",
  "insight",
  "guidance",
  "recommendation",
  "echo",
  "essence",
  "core object",
  "section",
]);

const SYMBOLIC_NOUNS = [
  "Beacon",
  "Lantern",
  "Engine",
  "Gate",
  "Mirror",
  "Thread",
  "Bridge",
  "Orchard",
  "Compass",
  "Archive",
  "Vessel",
  "Signal",
  "Key",
  "Root",
  "Mask",
  "Storm",
  "Threshold",
];

const SYMBOLIC_ADJECTIVES = [
  "Weighted",
  "Deferred",
  "Silent",
  "Threshold",
  "Hidden",
  "Luminous",
  "Restless",
  "Gathered",
  "Fractured",
  "Steady",
  "Remembered",
  "Unfinished",
];

const ARCHETYPES = [
  {
    name: "Threshold Bearer",
    tests: ["threshold", "gate", "door", "edge", "between", "cross", "future"],
  },
  {
    name: "Signal Keeper",
    tests: ["signal", "listen", "notice", "beacon", "message", "echo", "clarity"],
  },
  {
    name: "Reluctant Builder",
    tests: ["build", "make", "work", "step", "finish", "construct", "effort"],
  },
  {
    name: "Storm Architect",
    tests: ["storm", "pressure", "conflict", "friction", "tension", "crack", "politics"],
  },
  {
    name: "Memory Gardener",
    tests: ["memory", "garden", "grow", "return", "pattern", "recurring", "health"],
  },
  {
    name: "Bridge Walker",
    tests: ["bridge", "path", "move", "carry", "cross", "connect", "relationship"],
  },
  {
    name: "Veil Reader",
    tests: ["fear", "shadow", "uncertain", "uncertainty", "mystery", "inner"],
  },
  {
    name: "Mirror Analyst",
    tests: ["analysis", "ai", "technology", "judgment", "voice", "philosophy"],
  },
];

const THEME_MODES = [
  {
    color: "amber",
    tests: ["work", "pressure", "effort", "endurance", "burden", "cost", "build"],
  },
  {
    color: "cyan",
    tests: ["clarity", "signal", "technology", "ai", "distance", "analysis", "focus"],
  },
  {
    color: "violet",
    tests: ["mystery", "grief", "dream", "uncertainty", "uncertain", "inner", "philosophy"],
  },
  {
    color: "emerald",
    tests: ["growth", "health", "repair", "body", "ecology", "relationship", "care"],
  },
  {
    color: "crimson",
    tests: ["urgency", "anger", "danger", "conflict", "politics", "fear", "fight"],
  },
];

const CONCRETE_OBJECTS = [
  { label: "Gate", tests: ["gate", "door", "lock", "threshold", "choice"] },
  { label: "Lantern", tests: ["lantern", "light", "clarity", "guide", "focus"] },
  { label: "Mirror", tests: ["mirror", "reflect", "judgment", "self", "voice"] },
  { label: "Bridge", tests: ["bridge", "relationship", "connect", "between", "cross"] },
  { label: "Engine", tests: ["engine", "work", "build", "machine", "motivation", "ai"] },
  { label: "Orchard", tests: ["orchard", "garden", "growth", "health", "body"] },
  { label: "Compass", tests: ["compass", "direction", "future", "planning", "uncertainty"] },
  { label: "Threshold", tests: ["threshold", "future", "edge", "unknown", "change"] },
  { label: "Beacon", tests: ["beacon", "signal", "message", "notice", "attention"] },
  { label: "Key", tests: ["key", "lock", "solution", "open", "access"] },
  { label: "Vessel", tests: ["vessel", "body", "carry", "contain", "health"] },
  { label: "Storm", tests: ["storm", "politics", "conflict", "anger", "danger"] },
  { label: "Root", tests: ["root", "health", "repair", "body", "ground"] },
  { label: "Mask", tests: ["mask", "fear", "hide", "protect", "distort"] },
  { label: "Archive", tests: ["archive", "memory", "history", "pattern", "philosophy"] },
];

const WEAK_TITLES = new Set([
  "the witness under pressure",
  "the exhausted signal",
  "the measured self",
  "untitled cast",
  "untitled artifact",
  "pattern under tension",
]);

const WEAK_OBJECT_PHRASES = [
  "meaning arrives best when it is not forced",
  "youre not broken",
  "you're not broken",
  "if you try",
  "push harder",
  "the tension is",
  "the pressure point",
  "the desire to simply exist",
];

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compact(value = "", maxLength = 48) {
  const cleaned = cleanText(value).replace(/[.!?:;,\-]+$/g, "");

  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, maxLength).trim().replace(/[.!?:;,\-]+$/g, "")}...`;
}

function truncateAtWord(value = "", maxLength = 84) {
  const cleaned = cleanText(value).replace(/[.!?:;,\-]+$/g, "");

  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;

  const sliced = cleaned.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");

  return (lastSpace > 36 ? sliced.slice(0, lastSpace) : sliced).trim();
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value || "");

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function titleCase(value = "") {
  return cleanText(value)
    .toLowerCase()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSections(cast = {}) {
  return Array.isArray(cast?.sections) ? cast.sections.filter(Boolean) : [];
}

function getSection(cast = {}, type = "") {
  const expected = cleanText(type).toLowerCase();
  return (
    getSections(cast).find((section) => {
      const sectionType = cleanText(section?.type || section?.id).toLowerCase();
      const sectionTitle = cleanText(section?.title || section?.label).toLowerCase();

      return sectionType === expected || sectionTitle === expected;
    }) || {}
  );
}

function getSectionText(cast = {}, type = "") {
  const section = getSection(cast, type);

  return cleanText(
    section?.content ||
      section?.full ||
      section?.body ||
      section?.short ||
      section?.description
  );
}

function firstPhrase(value = "") {
  const cleaned = cleanText(value);
  const sentence = cleaned.split(/[.!?]/).find((part) => cleanText(part));
  const clause = cleanText(sentence || cleaned)
    .split(/[,;:\-]/)
    .find((part) => cleanText(part));

  return cleanText(clause || sentence || cleaned);
}

function isUsefulLabel(value = "") {
  const label = cleanText(value);

  return Boolean(label) && !GENERIC_LABELS.has(label.toLowerCase());
}

function normalizeKey(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isWeakTitle(value = "") {
  const key = normalizeKey(value);

  return (
    !key ||
    WEAK_TITLES.has(key) ||
    /^(the )?(witness|signal|pressure|pattern|daily cast)\b/.test(key)
  );
}

function isAdviceLike(value = "") {
  const key = normalizeKey(value);

  if (!key) return true;

  return (
    WEAK_OBJECT_PHRASES.some((phrase) => key.includes(phrase)) ||
    /^(you|your|try|push|pull|name|reduce|carry|move|notice|watch|let|stay|take)\b/.test(key) ||
    /\b(should|must|need to|trying to|not broken|forced)\b/.test(key)
  );
}

function weightedSources(cast = {}) {
  return [
    { text: cast?.question, weight: 3 },
    { text: cast?.input, weight: 2 },
    { text: getSectionText(cast, "signal"), weight: 2 },
    { text: getSectionText(cast, "tension"), weight: 2 },
    { text: getSectionText(cast, "pattern"), weight: 3 },
    { text: getSectionText(cast, "insight"), weight: 2 },
    {
      text:
        getSectionText(cast, "guidance") ||
        getSectionText(cast, "recommendation") ||
        getSectionText(cast, "advice"),
      weight: 1,
    },
    { text: cast?.echo, weight: 2 },
    { text: cast?.coreObject, weight: 1 },
    { text: cast?.coreCard?.description, weight: 1 },
    { text: cast?.coreCard?.imagePrompt, weight: 1 },
  ].filter((source) => cleanText(source.text));
}

function scoreOptions(cast = {}, options = [], fallback = "") {
  const sources = weightedSources(cast);
  const scores = options.map((option, index) => {
    const score = sources.reduce((total, source) => {
      const text = cleanText(source.text).toLowerCase();
      const hits = option.tests.reduce(
        (sum, test) => sum + (text.includes(test) ? source.weight : 0),
        0
      );

      return total + hits;
    }, 0);

    return { ...option, index, score };
  });
  const bestScore = Math.max(...scores.map((item) => item.score), 0);

  if (bestScore <= 0) return fallback;

  const tied = scores.filter((item) => item.score === bestScore);
  const seed = hashString(sources.map((source) => source.text).join(" :: "));

  return (
    tied[seed % tied.length]?.name ||
    tied[seed % tied.length]?.color ||
    tied[seed % tied.length]?.label ||
    fallback
  );
}

function getConcreteObjectMatch(cast = {}) {
  const focus = normalizeKey([cast?.question, cast?.input].filter(Boolean).join(" "));

  if (/\b(work|motivation|performance|effort|build)\b/.test(focus)) return "Engine";
  if (/\b(health|body|repair|care|tired)\b/.test(focus)) return "Root";
  if (/\b(relationship|relationships|asking for what i need|connect)\b/.test(focus)) return "Bridge";
  if (/\b(ai|technology)\b/.test(focus)) return "Engine";
  if (/\b(politics|political|conflict)\b/.test(focus)) return "Storm";
  if (/\b(philosophy|meaning|usefulness)\b/.test(focus)) return "Archive";
  if (/\b(fear|protect|distort)\b/.test(focus)) return "Mask";
  if (/\b(uncertainty|uncertain|direction)\b/.test(focus)) return "Compass";
  if (/\b(future|planning|outcome)\b/.test(focus)) return "Threshold";

  const label = scoreOptions(cast, CONCRETE_OBJECTS, "");

  return label || "";
}

function deriveMemoryLabel(section = {}, text = "") {
  const explicit = cleanText(section?.memoryLabel || section?.title || section?.name || section?.label);

  if (isUsefulLabel(explicit)) return compact(explicit);

  return compact(firstPhrase(text));
}

function collectCastText(cast = {}) {
  const sectionText = getSections(cast)
    .map((section) =>
      cleanText(
        section?.title ||
          section?.label ||
          section?.content ||
          section?.full ||
          section?.short
      )
    )
    .filter(Boolean)
    .join(" ");

  return [
    cast?.title,
    cast?.cardName,
    cast?.question,
    cast?.input,
    cast?.echo,
    cast?.coreObject,
    cast?.coreCard?.description,
    cast?.coreCard?.imagePrompt,
    sectionText,
  ]
    .filter(Boolean)
    .join(" ");
}

function deriveSymbolicObject(cast = {}) {
  const objectMatch = getConcreteObjectMatch(cast);
  const explicit = cleanText(
    cast?.coreObject ||
      cast?.essence ||
      cast?.coreCard?.description ||
      cast?.coreCard?.visual?.subject ||
      cast?.coreCard?.visual?.primaryMotif
  );

  if (objectMatch) {
    const seed = collectCastText(cast);
    const adjective = SYMBOLIC_ADJECTIVES[hashString(`${seed}-${objectMatch}`) % SYMBOLIC_ADJECTIVES.length];

    return `${adjective} ${objectMatch}`;
  }

  if (explicit && !isAdviceLike(explicit)) return compact(firstPhrase(explicit), 72);

  const phrase = firstPhrase(
    getSectionText(cast, "echo") ||
      getSectionText(cast, "insight") ||
      getSectionText(cast, "pattern") ||
      getSectionText(cast, "signal")
  );

  if (phrase && !isAdviceLike(phrase)) return compact(phrase, 72);

  const hash = hashString(collectCastText(cast));
  return `${SYMBOLIC_ADJECTIVES[hash % SYMBOLIC_ADJECTIVES.length]} ${
    SYMBOLIC_NOUNS[(hash >>> 4) % SYMBOLIC_NOUNS.length]
  }`;
}

function deriveTitle(cast = {}, seedText = "", coreObject = "") {
  const explicit = cleanText(cast?.title || cast?.cardName);

  if (isUsefulLabel(explicit) && !isWeakTitle(explicit)) {
    return compact(explicit, 42);
  }

  const sectionPhrase = firstPhrase(
    getSectionText(cast, "echo") ||
      getSectionText(cast, "insight") ||
      getSectionText(cast, "signal") ||
      getSectionText(cast, "pattern")
  );

  if (
    sectionPhrase &&
    !isAdviceLike(sectionPhrase) &&
    sectionPhrase.split(" ").length <= 5
  ) {
    return titleCase(compact(sectionPhrase, 42));
  }

  const hash = hashString(seedText);
  const objectWords = titleCase(coreObject)
    .split(" ")
    .filter(Boolean);
  const noun = objectWords[objectWords.length - 1] || SYMBOLIC_NOUNS[(hash >>> 4) % SYMBOLIC_NOUNS.length];
  const adjective =
    objectWords.length > 1
      ? objectWords.slice(0, -1).join(" ")
      : SYMBOLIC_ADJECTIVES[hash % SYMBOLIC_ADJECTIVES.length];

  return `The ${adjective} ${noun}`;
}

function deriveSubtitle({ title, archetype, coreObject, signal, tension }) {
  const objectPhrase = truncateAtWord(coreObject, 46).toLowerCase();
  const source = [tension, signal, coreObject]
    .map(firstPhrase)
    .find((phrase) => {
      const words = cleanText(phrase).split(" ").filter(Boolean);
      const weak =
        /^(the clearest signal|what.?s coming|what looks like|the signal is not confusion|the tension lives|push harder)\b/i.test(
          phrase
        );

      return (
        words.length >= 5 &&
        !/^if\b/i.test(phrase) &&
        !weak &&
        !isAdviceLike(phrase)
      );
    });

  if (source) return `${truncateAtWord(source, 78)}.`;
  if (objectPhrase) {
    const templates = {
      "Reluctant Builder": `A ${objectPhrase} turning effort into one visible move.`,
      "Memory Gardener": `A ${objectPhrase} restoring what pressure has worn thin.`,
      "Bridge Walker": `A ${objectPhrase} holding distance and contact in one frame.`,
      "Mirror Analyst": `A ${objectPhrase} separating true signal from borrowed reflection.`,
      "Storm Architect": `A ${objectPhrase} giving shape to volatile pressure.`,
      "Veil Reader": `A ${objectPhrase} revealing what protection has started to distort.`,
      "Threshold Bearer": `A ${objectPhrase} marking the crossing before the next choice.`,
    };

    return templates[archetype] || `${title} gathers the cast into symbolic form.`;
  }

  return `${archetype} moving through compressed meaning.`;
}

function deriveThemeColor(cast = {}) {
  const focus = normalizeKey([cast?.question, cast?.input].filter(Boolean).join(" "));

  if (/\b(politics|political|anger|danger|conflict|fear)\b/.test(focus)) {
    return "crimson";
  }
  if (/\b(health|body|repair|care|relationship|relationships)\b/.test(focus)) {
    return "emerald";
  }
  if (/\b(ai|technology|analysis|judgment|distance)\b/.test(focus)) {
    return "cyan";
  }
  if (/\b(philosophy|meaning|uncertainty|uncertain|future|planning|dream|inner)\b/.test(focus)) {
    return "violet";
  }
  if (/\b(work|motivation|performance|effort|burden|endurance)\b/.test(focus)) {
    return "amber";
  }

  return scoreOptions(cast, THEME_MODES, "") || "cyan";
}

function deriveArchetype(cast = {}) {
  const focus = normalizeKey([cast?.question, cast?.input].filter(Boolean).join(" "));

  if (/\b(relationship|relationships|connect|asking for what i need)\b/.test(focus)) {
    return "Bridge Walker";
  }
  if (/\b(health|body|repair|care)\b/.test(focus)) {
    return "Memory Gardener";
  }
  if (/\b(ai|technology|judgment|voice|philosophy|meaning)\b/.test(focus)) {
    return "Mirror Analyst";
  }
  if (/\b(fear|shadow|protect|distort)\b/.test(focus)) {
    return "Veil Reader";
  }
  if (/\b(politics|political|conflict|manipulative)\b/.test(focus)) {
    return "Storm Architect";
  }
  if (/\b(future|planning|uncertainty|uncertain|direction)\b/.test(focus)) {
    return "Threshold Bearer";
  }
  if (/\b(work|motivation|performance|effort|build)\b/.test(focus)) {
    return "Reluctant Builder";
  }

  return scoreOptions(cast, ARCHETYPES, "") || "Bridge Walker";
}

function buildMemoryLabels(cast = {}, coreObject = "") {
  const signal = getSectionText(cast, "signal");
  const tension = getSectionText(cast, "tension");
  const pattern = getSectionText(cast, "pattern");
  const insight = getSectionText(cast, "insight");
  const guidance =
    getSectionText(cast, "guidance") ||
    getSectionText(cast, "recommendation") ||
    getSectionText(cast, "advice") ||
    cleanText(cast?.guidance || cast?.recommendation || cast?.advice);
  const echo = cleanText(cast?.echo) || getSectionText(cast, "echo");

  return {
    signal: deriveMemoryLabel(getSection(cast, "signal"), signal),
    tension: deriveMemoryLabel(getSection(cast, "tension"), tension),
    pattern: deriveMemoryLabel(getSection(cast, "pattern"), pattern),
    insight: deriveMemoryLabel(getSection(cast, "insight"), insight),
    guidance: deriveMemoryLabel(
      getSection(cast, "guidance").type ? getSection(cast, "guidance") : getSection(cast, "recommendation"),
      guidance
    ),
    echo: deriveMemoryLabel({}, echo),
    coreObject: deriveMemoryLabel(
      { title: cast?.coreCard?.name || cast?.coreCard?.title },
      coreObject
    ),
  };
}

export function deriveCoreCardFromCast(cast = {}) {
  const sourceText = collectCastText(cast);
  const signal = getSectionText(cast, "signal");
  const tension = getSectionText(cast, "tension");
  const pattern = getSectionText(cast, "pattern");
  const insight = getSectionText(cast, "insight");
  const guidance =
    getSectionText(cast, "guidance") ||
    getSectionText(cast, "recommendation") ||
    getSectionText(cast, "advice") ||
    cleanText(cast?.guidance || cast?.recommendation || cast?.advice);
  const essence =
    cleanText(cast?.essence || cast?.coreObject) ||
    cleanText(cast?.echo) ||
    getSectionText(cast, "essence");
  const coreObject = deriveSymbolicObject({
    ...cast,
    essence,
  });
  const title = deriveTitle(cast, [sourceText, coreObject].join(" :: "), coreObject);
  const archetype = deriveArchetype({
    ...cast,
    coreObject,
  });
  const themeColor = deriveThemeColor({
    ...cast,
    coreObject,
  });
  const subtitle = deriveSubtitle({
    title,
    archetype,
    coreObject,
    signal,
    tension,
  });
  const memoryLabels = buildMemoryLabels(cast, coreObject);
  const existing = cast?.coreCard && typeof cast.coreCard === "object" ? cast.coreCard : {};

  return {
    ...existing,
    title,
    name: title,
    subtitle,
    coreObject,
    description: coreObject,
    archetype,
    themeColor,
    memoryLabels,
    hook: cleanText(existing.hook) || subtitle,
    imagePrompt:
      cleanText(existing.imagePrompt) ||
      [
        `${title}, tarot-style symbolic core card`,
        `core object: ${coreObject}`,
        `archetype: ${archetype}`,
        `theme color: ${themeColor}`,
        signal ? `signal: ${compact(signal, 96)}` : "",
        tension ? `tension: ${compact(tension, 96)}` : "",
        pattern ? `pattern: ${compact(pattern, 96)}` : "",
        insight ? `insight: ${compact(insight, 96)}` : "",
        guidance ? `guidance: ${compact(guidance, 96)}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
  };
}
