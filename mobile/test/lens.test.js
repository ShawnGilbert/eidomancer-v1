import assert from "node:assert/strict";
import test from "node:test";
import { cases } from "../evaluation/cases.js";
import { parseReading } from "../server/lens.js";
import { dailySignal, reflections } from "../src/content.js";
import { readConsent, writeConsent } from "../src/consent.js";

const conflict = cases.find(({ id }) => id === "promise-conduct-crack");
const response = {
  analysis: {
    signal: "You report two early departures and one closing when duties were posted.",
    tension: "Splitting the work matters because leftover cleanup could cost you the bus.",
    pattern: "The exits happened on two shifts. Posted duties may matter, given the Saturday exception.",
    alternative: "Saturday could also have differed in workload or when your coworker needed to leave.",
    insight: "A specific closing assignment gives you more information before the last bus.",
    essence: "The agreement is more useful when the tasks are visible.",
    echo: "If departures continue after roles are posted, you may need to plan around unshared work.",
    guidance: "Post each person's tasks for two shifts and check what is complete fifteen minutes before the bus.",
    recurrence: "recurring",
    evidence: conflict.expectedEvidence.map(([kind, quote]) => ({ kind, quote })),
  },
  imagery: { title: "The Last Bus and the Unhung Broom", metaphor: "Put a hook on the wall before the bus turns the corner." },
};
const evaluate = (value, account = conflict.account) => parseReading(JSON.stringify(value), account);

test("retains the Saturday crack, distinguishes declared intent, and preserves bus consequences", () => {
  const reading = evaluate(response);
  assert.equal(reading.recurrence, "recurring");
  assert.equal(reading.evidence.find(({ kind }) => kind === "exception").quote, conflict.expectedEvidence[3][1]);
  assert.equal(reading.evidence.find(({ kind }) => kind === "declaration").quote, conflict.expectedEvidence[0][1]);
  assert.match(reading.alternative, /workload/);
  assert.match(reading.guidance, /fifteen minutes before the bus/);
});

test("changing symbolic presentation cannot change evidence, analysis or conditional guidance", () => {
  const separate = ({ title, metaphor, ...analysis }) => analysis;
  const reframed = { ...response, imagery: { title: "The Unfinished Shift", metaphor: "A door closes before the dust settles." } };
  assert.deepEqual(separate(evaluate(response)), separate(evaluate(reframed)));
});

test("rejects fabricated evidence and duplicated conduct used as recurrence", () => {
  for (const evidence of [
    [...response.analysis.evidence, { kind: "conduct", quote: "She laughed at the bus schedule." }],
    [response.analysis.evidence[1], response.analysis.evidence[1]],
    [response.analysis.evidence[0], response.analysis.evidence[1], response.analysis.evidence[3]],
  ]) assert.equal(evaluate({ ...response, analysis: { ...response.analysis, evidence } }), null);
});

test("one late reply can be reported without manufacturing a recurring pattern", () => {
  const account = cases.find(({ id }) => id === "one-late-reply").account;
  const analysis = {
    signal: "You describe one reply that arrived two days late.",
    tension: "You want to know whether the delay reflects a change in the friendship.",
    pattern: "One late reply does not establish a pattern.",
    alternative: "Your friend may have been busy. You have no evidence about their reason.",
    insight: "A normal follow-up can give you more information than guessing.",
    essence: "The delay leaves the cause open.",
    echo: "If slower replies become common, how they follow up could help explain what changed.",
    guidance: "Send an ordinary invitation and see how they respond.",
    recurrence: "unestablished",
    evidence: [{ kind: "conduct", quote: "My friend replied two days late this week." }],
  };
  assert.ok(evaluate({ ...response, analysis }, account));
  assert.equal(evaluate({ ...response, analysis: { ...analysis, recurrence: "recurring" } }, account), null);
});

test("a full Daily Signal cycle has no repeat titles or prompts", () => {
  const sequence = reflections.map((_, index) => dailySignal(new Date(2026, 10, 11 + index)));
  assert.equal(sequence.length, 52);
  for (const field of ["title", "signal", "guidance"]) {
    assert.equal(new Set(sequence.map((entry) => entry[field])).size, 52);
  }
});

test("first-use consent persists and withdrawal requires another opt-in", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  assert.equal(readConsent(storage), false);
  writeConsent(storage, true);
  assert.equal(readConsent(storage), true);
  writeConsent(storage, false);
  assert.equal(readConsent(storage), false);
});

test("the same savings can support different guidance when the observer's downside changes", () => {
  const highRisk = cases.find(({ id }) => id === "housing-asymmetric-risk");
  const lowerRisk = cases.find(({ id }) => id === "housing-altered-priority");
  const options = [
    [highRisk, "I cannot afford another move", "Keep the current lease while you test nighttime noise.",
      "Losing the ability to record or affording another move could outweigh the monthly savings."],
    [lowerRisk, "I can afford another move if it fails", "Try a short stay and keep enough money set aside to move again.",
      "With recording handled elsewhere, a short trial can tell you whether the savings are worth it."],
  ];
  const results = options.map(([item, priority, guidance, insight]) => evaluate({
    imagery: { title: "The Price of the Door", metaphor: "The same key can carry a different weight." },
    analysis: {
      signal: "The proposed studio saves $150 a month and your lease is month to month.",
      tension: "The savings have to be weighed against the cost of changing homes.",
      pattern: "You have a proposed move and no repeated outcomes to compare.",
      alternative: "The actual terms of a trial may affect how easily you can reverse the decision.",
      insight,
      essence: "The same rent difference can carry different risk.",
      echo: "If the trial reveals a cost you cannot absorb, the current lease gives you another path.",
      guidance,
      recurrence: "unestablished",
      evidence: [{ kind: "priority", quote: priority }],
    },
  }, item.account));
  assert.equal(results[0].signal, results[1].signal);
  assert.match(results[0].guidance, /Keep the current lease/);
  assert.match(results[1].guidance, /Try a short stay/);
  assert.equal(evaluate({ ...response, analysis: { ...response.analysis, evidence: results[0].evidence } }, lowerRisk.account), null);
});
