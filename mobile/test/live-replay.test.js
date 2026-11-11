import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseReading } from "../server/lens.js";
import { generateReading } from "../server/reading.js";

// These are the exact completion strings and submitted accounts as recorded
// in the uploaded f2397a8 run. Replay uses a stubbed provider and moderation.
const cases = JSON.parse(readFileSync(new URL("./fixtures/phase3-second-live-run.json", import.meta.url), "utf8"));
assert.equal(cases.length, 6);

for (const { id, mode, account, uneditedCompletion } of cases) {
  test(`second live batch parser replay: ${id}`, async () => {
    const moderationInputs = [];
    const { reading, error } = await generateReading({
      input: account, mode, model: "offline-live-replay",
      client: {
        moderations: { create: async ({ input }) => {
          moderationInputs.push(input);
          return { results: [{ flagged: false }] };
        } },
        chat: { completions: { create: async () => ({
          choices: [{ message: { content: uneditedCompletion } }],
        }) } },
      },
    });

    assert.equal(error, undefined);
    assert.ok(reading);
    const { analysis: original, imagery } = JSON.parse(uneditedCompletion);
    const { evidence, ...analysis } = original;
    for (const [key, value] of Object.entries(analysis)) {
      assert.equal(reading[key], typeof value === "string" ? value.trim() : value);
    }
    assert.deepEqual(reading.evidence, evidence.filter(({ quote }) => account.includes(quote)));
    assert.equal(reading.title, imagery.title.trim());
    assert.ok(reading.metaphor.length <= 180);
    assert.equal(moderationInputs.length, 2);
    assert.equal(moderationInputs[0], account);
    assert.ok(moderationInputs[1].includes(reading.metaphor));
    if (imagery.metaphor.length > 180) {
      assert.match(reading.metaphor, /…$/u);
      assert.ok(imagery.metaphor.startsWith(reading.metaphor.slice(0, -1)));
    } else {
      assert.equal(reading.metaphor, imagery.metaphor.trim());
    }
    if (id === "open-reflection") {
      assert.deepEqual(evidence, [{ quote: "Ask Eidomancer", kind: "declaration" }]);
      assert.deepEqual(reading.evidence, []);
      assert.ok(!moderationInputs[1].includes("Ask Eidomancer"));
      const withEmptyEvidence = { analysis: { ...original, evidence: [] }, imagery };
      assert.deepEqual(parseReading(JSON.stringify(withEmptyEvidence), account), reading);
    }
  });
}

test("long imagery is clipped within both limits without splitting a surrogate pair", () => {
  const { account, uneditedCompletion } = cases[0];
  const response = JSON.parse(uneditedCompletion);
  response.imagery.title = "a".repeat(78) + "🜁".repeat(3);
  response.imagery.metaphor = "a".repeat(178) + "🜁".repeat(3);
  const reading = parseReading(JSON.stringify(response), account);
  assert.equal(reading.title, "a".repeat(78) + "…");
  assert.equal(reading.metaphor, "a".repeat(178) + "…");
});
