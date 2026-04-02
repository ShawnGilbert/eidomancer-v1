function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function nowIso() {
  return new Date().toISOString();
}

function archetypeFromQuestion(question) {
  const q = question.toLowerCase();

  if (q.includes("focus") || q.includes("next")) return "The Narrowing Path";
  if (q.includes("refusing") || q.includes("admit")) return "The Hidden Knot";
  if (q.includes("momentum") || q.includes("drain")) return "The Leaking Vessel";
  if (q.includes("emerge")) return "The Unarmored Self";
  if (q.includes("pattern")) return "The Loop That Knows";

  return "The Signal Beneath the Noise";
}

function symbolFromArchetype(archetype) {
  const map = {
    "The Narrowing Path": "A dim trail tightening through a dense forest",
    "The Hidden Knot": "A rope twisted around itself, resisting untangling",
    "The Leaking Vessel": "A cracked container slowly losing its contents",
    "The Unarmored Self": "A figure removing armor under soft light",
    "The Loop That Knows": "A spiral folding back into itself",
    "The Signal Beneath the Noise": "A faint pulse beneath static",
  };

  return map[archetype] || "A shifting, undefined symbol";
}

function titleFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) return "The Spiral of Becoming";
  if (lower.includes("momentum")) return "The Friction Beneath Motion";
  if (lower.includes("focus")) return "The Narrowing Beam";
  if (lower.includes("refusing") || lower.includes("admit")) {
    return "The Gate of Avoided Knowing";
  }
  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "The Quiet Pulse of Becoming";
  }

  return "Pattern Under Tension";
}

function sigilFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) return "🜂 ◌ 🜁";
  if (lower.includes("momentum")) return "⟁ ↯ ⟁";
  if (lower.includes("focus")) return "◉ ⌁ ◉";
  if (lower.includes("refusing") || lower.includes("admit")) return "⚶ ✦ ⚶";
  if (lower.includes("emerge") || lower.includes("resisting")) return "☽ ✧ ☽";

  return "✦ ◌ ✦";
}

function sectionSigils() {
  return {
    archetype: "◈",
    oracle: "✧",
    threshold: "◬",
    omen: "⟁",
    pattern: "≈",
    tension: "🔥",
    insight: "✺",
    advice: "⬢",
    invitation: "☉",
    echo: "◎",
  };
}

function omenFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) {
    return "The circle is not a prison unless you forget that spirals also return.";
  }

  if (lower.includes("momentum")) {
    return "What feels like stalled motion may be force leaking through too many exits.";
  }

  if (lower.includes("focus")) {
    return "A scattered lantern still gives light, but a narrowed beam reveals the path.";
  }

  if (lower.includes("refusing") || lower.includes("admit")) {
    return "The truth you avoid often stands closest to the door that would actually open.";
  }

  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "What wants to live in you rarely arrives shouting. It waits for permission.";
  }

  return "The signal is present, but the vessel has not fully aligned around it yet.";
}

function patternFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) {
    return "You are moving through a recurring structure that resembles a circle, but the deeper truth is that you are revisiting the same terrain with slightly more awareness each time.";
  }

  if (lower.includes("momentum")) {
    return "Your movement is real, but it keeps colliding with hidden drag: fatigue, divided attention, and too many simultaneous meanings competing for action.";
  }

  if (lower.includes("focus")) {
    return "You are standing in a field of possible directions, but your attention is diffused across too many worthy threads for any one of them to gather force.";
  }

  if (lower.includes("refusing") || lower.includes("admit")) {
    return "A truth is already present in your system, but it remains half-veiled because acknowledging it would demand a change in posture, not just a change in thought.";
  }

  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "Something quieter and more honest is trying to come forward, but it cannot fully emerge while your energy is still invested in bracing against uncertainty.";
  }

  return "You are standing inside a repeated structure where insight is already present, but full movement is delayed by hesitation, emotional drag, or split commitment.";
}

function tensionFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) {
    return "You may be mistaking recurrence for failure when it could actually be refinement in disguise.";
  }

  if (lower.includes("momentum")) {
    return "Part of you wants forward motion, while another part keeps trying to solve the whole map before permitting the next step.";
  }

  if (lower.includes("focus")) {
    return "You are tempted to honor every signal at once, which creates the feeling of responsibility without the traction of commitment.";
  }

  if (lower.includes("refusing") || lower.includes("admit")) {
    return "The cost of clarity is that it may force you to stop narrating around the issue and start naming it directly.";
  }

  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "The more tightly you grip control, the harder it becomes for the next authentic form of yourself to take shape.";
  }

  return "Part of you wants transformation, but another part still organizes itself around the familiar weight of old loops.";
}

function insightFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) {
    return "The pattern is not simple repetition. It is a spiral. The scenery returns, but you are not the same traveler each time you pass it.";
  }

  if (lower.includes("momentum")) {
    return "What looks like laziness may actually be overloaded meaning. Too many live threads are diluting force.";
  }

  if (lower.includes("focus")) {
    return "Focus is not discovering the perfect target. It is choosing a worthy target long enough for signal to outweigh static.";
  }

  if (lower.includes("refusing") || lower.includes("admit")) {
    return "The mind often hides from truths that would require grief, effort, or identity change. The resistance is information.";
  }

  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "Emergence rarely feels dramatic at first. It often feels like relief mixed with vulnerability.";
  }

  return "The pattern is not lack of intelligence. It is partial clarity without a committed channel for expression.";
}

function adviceFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) {
    return "Track what is improving, not just what is returning. Notice the degree of change inside the repetition.";
  }

  if (lower.includes("momentum")) {
    return "Reduce the next move until it becomes visible and survivable. Let proof create energy instead of waiting for energy to create proof.";
  }

  if (lower.includes("focus")) {
    return "Choose one thread to privilege for the next seven days. Protect it from dilution. Let the others wait without being erased.";
  }

  if (lower.includes("refusing") || lower.includes("admit")) {
    return "Write the avoided sentence plainly. Do not solve it yet. Just remove its camouflage.";
  }

  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "Loosen the grip. Make room for a softer move, a smaller truth, or a less armored desire to speak.";
  }

  return "Reduce the next step to something visible and survivable. Name the friction, choose one action, and let momentum return through proof rather than mood.";
}

function echoFromQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes("pattern")) return "You are not looping. You are spiraling.";
  if (lower.includes("momentum")) return "Motion returns when drag is named.";
  if (lower.includes("focus")) return "A chosen beam burns brighter than scattered light.";
  if (lower.includes("refusing") || lower.includes("admit")) {
    return "The avoided truth is already in the room.";
  }
  if (lower.includes("emerge") || lower.includes("resisting")) {
    return "What wants to live in you needs a little less armor.";
  }

  return "You do not need total certainty. You need one honest move.";
}

function readingFromParts({ title, omen, pattern, tension, insight, advice, echo }) {
  return `${title} appears when a part of your life is already trying to change, but your inner posture has not fully caught up to that change yet.

${omen}

What this cast suggests is not simple confusion. ${pattern}

The strain comes from this split: ${tension}

What becomes visible now is this: ${insight}

The invitation is not to force a grand transformation all at once. ${advice}

Take the echo with you: ${echo}`;
}

function thresholdFromParts({ archetype, symbol }) {
  return `You are standing at the threshold of ${archetype.toLowerCase()}. The image here is ${symbol.toLowerCase()}.`;
}

function invitationFromAdvice(advice) {
  return `For now, let this be enough: ${advice}`;
}

export function buildCastRecord(question) {
  const title = titleFromQuestion(question);
  const archetype = archetypeFromQuestion(question);
  const symbol = symbolFromArchetype(archetype);
  const sigil = sigilFromQuestion(question);
  const sigils = sectionSigils();
  const omen = omenFromQuestion(question);
  const pattern = patternFromQuestion(question);
  const tension = tensionFromQuestion(question);
  const insight = insightFromQuestion(question);
  const advice = adviceFromQuestion(question);
  const echo = echoFromQuestion(question);

  return {
    id: `cast_${Date.now()}_${slugify(title)}`,
    theme: "The Emergent Ones",
    input: {
      type: "question",
      question,
      sourceText: "",
    },
    cast: {
      title,
      archetype,
      oracle: echo,
      symbol,
      sigil,
      sigils,
      omen,
      threshold: thresholdFromParts({ archetype, symbol }),
      reading: readingFromParts({
        title,
        omen,
        pattern,
        tension,
        insight,
        advice,
        echo,
      }),
      invitation: invitationFromAdvice(advice),
      pattern,
      tension,
      insight,
      advice,
      echo,
    },
    assets: {
      coreCard: null,
      echo: null,
      lyrics: null,
      suno: null,
      youtube: null,
      fullPackage: null,
    },
    createdAt: nowIso(),
  };
}