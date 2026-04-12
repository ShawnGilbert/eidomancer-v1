// D:\eidomancer\src\lib\engagementMode.js

const DEFAULT_MODE = "seeker";

const MODE_KEYWORDS = {
  directSeeker: [
    "just tell me",
    "just give me",
    "quick answer",
    "what should i do",
    "fix this",
    "make it so",
    "do it for me",
    "just do it",
  ],
  seeker: [
    "what does this mean",
    "i'm not sure",
    "im not sure",
    "help me understand",
    "trying to understand",
    "curious",
    "feels like",
    "i wonder",
    "not sure",
  ],
  forger: [
    "why",
    "how",
    "test",
    "compare",
    "refine",
    "challenge",
    "push this",
    "what breaks",
    "tradeoff",
  ],
  architect: [
    "pattern",
    "system",
    "feedback loop",
    "meta",
    "archetype",
    "framework",
    "structure",
    "trajectory",
    "behavior",
    "identity",
  ],
};

const EMPTY_SCORES = {
  directSeeker: 0,
  seeker: 0,
  forger: 0,
  architect: 0,
};

function normalize(text = "") {
  return String(text).toLowerCase().trim();
}

function countKeywordHits(text, keywords = []) {
  return keywords.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
}

function scoreLengthHeuristic(text, scores) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount <= 6) {
    scores.directSeeker += 2;
  } else if (wordCount <= 16) {
    scores.seeker += 1;
  } else if (wordCount <= 40) {
    scores.forger += 1;
  } else {
    scores.architect += 1;
  }
}

function scoreQuestionHeuristic(text, scores) {
  const whyHowCount =
    (text.match(/\bwhy\b/g) || []).length +
    (text.match(/\bhow\b/g) || []).length;

  const meaningCount =
    (text.match(/\bmeaning\b/g) || []).length +
    (text.match(/\bfeel\b/g) || []).length +
    (text.match(/\bunderstand\b/g) || []).length;

  const systemCount =
    (text.match(/\bsystem\b/g) || []).length +
    (text.match(/\bpattern\b/g) || []).length +
    (text.match(/\bloop\b/g) || []).length +
    (text.match(/\bframework\b/g) || []).length;

  scores.forger += whyHowCount;
  scores.seeker += meaningCount;
  scores.architect += systemCount;
}

export function detectEngagementMode(input = "", history = []) {
  const text = normalize(input);
  const scores = { ...EMPTY_SCORES };

  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    scores[mode] += countKeywordHits(text, keywords);
  }

  scoreLengthHeuristic(text, scores);
  scoreQuestionHeuristic(text, scores);

  if (Array.isArray(history) && history.length > 0) {
    const priorModes = history
      .map((item) => item?.metadata?.engagementMode || item?.engagementMode)
      .filter(Boolean)
      .slice(-5);

    for (const mode of priorModes) {
      if (scores[mode] !== undefined) {
        scores[mode] += 0.5;
      }
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topMode, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;

  const mode = topScore <= 0 ? DEFAULT_MODE : topMode;
  const confidence =
    topScore <= 0 ? 0.25 : Math.min(0.95, 0.5 + (topScore - secondScore) * 0.15);

  return {
    mode,
    confidence,
    scores,
  };
}

export const engagementModeProfiles = {
  directSeeker: {
    title: "Direct Seeker",
    tone: "grounding",
    emphasis: "clarity",
    adviceStyle: "gentle_friction",
    languageBias: [
      "start with the clearest thread",
      "take the first answer as a foothold, not a verdict",
      "move clearly, then verify",
    ],
  },
  seeker: {
    title: "Path Seeker",
    tone: "guiding",
    emphasis: "meaning",
    adviceStyle: "encouraging_direction",
    languageBias: [
      "stay with the question",
      "follow the thread",
      "you are already noticing something real",
    ],
  },
  forger: {
    title: "Signal Forger",
    tone: "challenging",
    emphasis: "refinement",
    adviceStyle: "active_testing",
    languageBias: [
      "test the edge",
      "push the pattern",
      "refine before concluding",
    ],
  },
  architect: {
    title: "Pattern Architect",
    tone: "reflective",
    emphasis: "systems",
    adviceStyle: "meta_awareness",
    languageBias: [
      "watch the loop",
      "notice the structure",
      "study the pattern shaping the choice",
    ],
  },
};