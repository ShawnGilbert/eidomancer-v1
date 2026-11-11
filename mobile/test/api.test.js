import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { once } from "node:events";
import express from "express";
import { createMobileApi } from "../server/api.js";
import { fields, parseReading } from "../server/lens.js";
import { dailySignal } from "../src/content.js";

const account = "I took the late shift twice when the schedule changed.";
const structured = {
  analysis: {
    ...Object.fromEntries(fields.slice(1).map((field) => [field, `Sample ${field}`])),
    alternative: "The schedule may have changed independently.", recurrence: "unestablished",
    evidence: [{ kind: "conduct", quote: "I took the late shift twice" }],
  },
  imagery: { title: "The Shifted Clock", metaphor: "The clock moved before the hands did." },
};
const reading = parseReading(JSON.stringify(structured), account);

async function fixture(t, overrides = {}) {
  const calls = [];
  const reportDir = await mkdtemp(path.join(tmpdir(), "eidomancer-"));
  const app = express();
  app.use("/api/mobile", createMobileApi({
    client: {
      moderations: { create: async ({ input }) => {
        calls.push("moderation");
        return { results: [{ flagged: input.includes("test blocked") }] };
      } },
      chat: { completions: { create: async (request) => {
        calls.push(request);
        return { choices: [{ message: { content: JSON.stringify(structured) } }] };
      } } },
    },
    reportDir, reportKey: Buffer.alloc(32, 7), perIp: 12, perDay: 100,
    reportDailyLimit: 100, model: "test-model", ...overrides,
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(reportDir, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${server.address().port}/api/mobile`;
  const post = (route, body) => fetch(`${url}/${route}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return { url, post, calls, reportDir };
}

test("Daily Signal changes with the local calendar date", () => {
  const morning = dailySignal(new Date(2026, 10, 11, 1));
  assert.deepEqual(morning, dailySignal(new Date(2026, 10, 11, 23)));
  assert.notDeepEqual(morning, dailySignal(new Date(2026, 10, 12, 1)));
});

test("requires consent and rejects malformed inputs before a model call", async (t) => {
  const { post, calls } = await fixture(t);
  for (const body of [
    { mode: "ask", input: "This is a real question." },
    { mode: "constructor", input: "This is a real question.", consent: true },
    { mode: "pattern", input: [], consent: true },
    { mode: "ask", input: "x".repeat(1801), consent: true },
  ]) assert.equal((await post("readings", body)).status, 400);
  assert.equal(calls.length, 0);
});

test("blocks flagged input and applies the global reading cap", async (t) => {
  const { post, calls } = await fixture(t, { perDay: 1 });
  assert.equal((await post("readings", { mode: "ask", input: "test blocked content", consent: true })).status, 422);
  assert.equal((await post("readings", { mode: "ask", input: "What should I do next?", consent: true })).status, 429);
  assert.deepEqual(calls, ["moderation"]);
});

test("returns seven layers and records an authenticated report once", async (t) => {
  const { url, post, calls, reportDir } = await fixture(t);
  const preflight = await fetch(`${url}/readings`, { method: "OPTIONS", headers: {
    Origin: "capacitor://localhost", "Access-Control-Request-Method": "POST",
  } });
  assert.equal(preflight.headers.get("access-control-allow-origin"), "capacitor://localhost");
  const result = await post("readings", { mode: "pattern", input: account, consent: true });
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.deepEqual(data.reading, reading);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].messages[1].role, "user");
  assert.match(calls[1].messages[0].content, /Situated Valuation/);
  const { reportToken } = data;
  const tampered = (reportToken[0] === "x" ? "y" : "x") + reportToken.slice(1);
  assert.equal((await post("reports", { token: tampered, reason: "unsafe" })).status, 400);
  assert.equal((await post("reports", { token: reportToken, reason: "misleading" })).status, 201);
  assert.equal((await post("reports", { token: reportToken, reason: "misleading" })).status, 201);
  const files = await readdir(reportDir);
  assert.equal(files.length, 1);
  const stored = JSON.parse(await readFile(path.join(reportDir, files[0]), "utf8"));
  assert.deepEqual(stored.reading, Object.fromEntries(Object.entries(reading).filter(([key]) => key !== "evidence")));
  assert.equal(stored.reason, "misleading");
  assert.equal(stored.mode, "pattern");
  assert.equal(Object.hasOwn(stored, "input"), false);
});

test("a missing or exhausted entitlement never reaches moderation", async (t) => {
  let access = "unlicensed";
  const { post, calls } = await fixture(t, { entitlements: { reserve: () => access } });
  const question = { mode: "ask", input: account, consent: true };
  assert.equal((await post("readings", question)).status, 401);
  access = "limited";
  assert.equal((await post("readings", question)).status, 429);
  assert.deepEqual(calls, []);
});
