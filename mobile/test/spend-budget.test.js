import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { candidateModel, completionLimit } from "../server/model-rates.js";
import { createSpendBudget, MonthlySpendLimitError } from "../server/spend-budget.js";
import { generateReading } from "../server/reading.js";
import { layers } from "../src/content.js";

const request = { model: candidateModel, max_completion_tokens: completionLimit };
const completion = {
  model: candidateModel, service_tier: "default",
  usage: { prompt_tokens: 1600, completion_tokens: 600, prompt_tokens_details: { cached_tokens: 900 } },
};
const unexpected = () => assert.fail("Provider should not have been invoked.");

function setup(t, monthlyUsd = "5") {
  const dir = mkdtempSync(path.join(os.tmpdir(), "eido-spend-"));
  const database = path.join(dir, "budget.sqlite");
  writeFileSync(database, "");
  const connections = [];
  let now = new Date("2026-11-30T23:59:59.900Z");
  const settings = { database, monthlyUsd, model: candidateModel, clock: () => now };
  t.after(() => {
    for (const connection of connections) if (connection.isOpen) connection.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    settings,
    open: (overrides = {}) => {
      const budget = createSpendBudget({ ...settings, ...overrides });
      connections.push({ close: () => budget.close(), isOpen: true });
      return budget;
    },
    inspect: () => {
      const db = new DatabaseSync(database);
      connections.push(db);
      return db;
    },
    nextMonth: () => { now = new Date("2026-12-01T00:00:00.100Z"); },
  };
}

test("monthly reservations survive restart and retain the full hold on timeout or missing usage", async (t) => {
  const { settings, open, inspect, nextMonth } = setup(t, "0.61");
  const first = createSpendBudget(settings);
  try {
    await assert.rejects(first.complete(request, async () => { throw new Error("timeout"); }), /timeout/);
    await first.complete(request, async () => ({ model: candidateModel }));
  } finally { first.close(); }
  const restarted = open();
  await assert.rejects(restarted.complete(request, unexpected), MonthlySpendLimitError);
  assert.equal(inspect().prepare("SELECT reserved_nanos FROM mobile_monthly_spend").get().reserved_nanos, 609_450_000);
  nextMonth();
  await restarted.complete(request, async () => completion);
  assert.equal(inspect().prepare("SELECT reserved_nanos FROM mobile_monthly_spend WHERE month = '2026-12'").get().reserved_nanos, 3_900_000);
});

test("two connections cannot over-reserve and settlement stays in the request's UTC month", async (t) => {
  const { open, nextMonth, inspect } = setup(t, "0.31");
  const first = open();
  const second = open();
  let finish;
  const pending = first.complete(request, () => new Promise((resolve) => { finish = resolve; }));
  await assert.rejects(second.complete(request, unexpected), MonthlySpendLimitError);
  nextMonth();
  finish(completion);
  await pending;
  assert.deepEqual(inspect().prepare("SELECT month, reserved_nanos FROM mobile_monthly_spend").all()
    .map(({ month, reserved_nanos }) => [month, reserved_nanos]), [["2026-11", 3_900_000]]);
});

test("invalid settings and database failures fail closed", async (t) => {
  const { open, inspect, settings } = setup(t);
  for (const monthlyUsd of ["", "NaN", "-1", "5.001", "1e3"]) {
    assert.throws(() => createSpendBudget({ ...settings, monthlyUsd }), /decimal dollar/);
  }
  assert.throws(() => createSpendBudget({ ...settings, model: "unpriced-model" }), /approved, pinned/);
  assert.throws(() => createSpendBudget({ ...settings, database: settings.database + ".missing" }), /Initialize/);
  const budget = open();
  await assert.rejects(budget.complete({ ...request, max_completion_tokens: 1051 }, unexpected), /metered model contract/);
  inspect().exec("DROP TABLE mobile_monthly_spend");
  await assert.rejects(budget.complete(request, unexpected), /no such table/);
});

test("provider pricing anomalies persistently halt further requests", async (t) => {
  const { open, nextMonth } = setup(t);
  await assert.rejects(open().complete(request, async () => ({
    ...completion, model: "unexpected-model",
  })), /provider completion exceeded/i);
  nextMonth();
  await assert.rejects(open().complete(request, unexpected), MonthlySpendLimitError);
});

test("candidate keeps the strict seven-layer contract through the metered path", async (t) => {
  const budget = setup(t).open();
  const text = JSON.stringify({
    analysis: {
      ...Object.fromEntries(Object.keys(layers).map((key) => [key, `Fixture ${key}`])),
      alternative: "Check what else changed.", recurrence: "unestablished", evidence: [],
    },
    imagery: { title: "The Turn", metaphor: "A hinge makes space for another possibility." },
  });
  const result = await generateReading({
    input: "Which small change is worth trying?", mode: "ask", model: candidateModel,
    client: {
      moderations: { create: async () => ({ results: [{ flagged: false }] }) },
      chat: { completions: { create: (input) => budget.complete(input, async (metered) => {
        assert.equal(metered.service_tier, "default");
        assert.equal(metered.reasoning_effort, "none");
        assert.equal(metered.response_format.json_schema.strict, true);
        return { ...completion, choices: [{ message: { content: text } }] };
      }) } },
    },
  });
  assert.ok(Object.keys(layers).every((key) => result.reading[key] === `Fixture ${key}`));
});
