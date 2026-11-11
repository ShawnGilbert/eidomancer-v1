import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createPilotApp } from "../web/server/app.js";
import { day, openLedger } from "../web/server/ledger.js";
import { createSpendBudget, MonthlySpendLimitError } from "../server/spend-budget.js";
import { candidateModel } from "../server/model-rates.js";
import { fields } from "../server/lens.js";

const origin = "https://pilot.example";
const key = Buffer.alloc(32, 19);
const question = "I took the late shift twice when the schedule changed.";
const draft = {
  analysis: {
    ...Object.fromEntries(fields.slice(1).map((field) => [field, `Synthetic ${field}`])),
    alternative: "The schedule may have changed independently.", recurrence: "unestablished",
    evidence: [{ kind: "conduct", quote: "I took the late shift twice" }],
  },
  imagery: { title: "A Shifted Clock", metaphor: "The clock moved before the hands did." },
};
const good = {
  model: candidateModel, usage: { prompt_tokens: 1600, completion_tokens: 600 },
  choices: [{ message: { content: JSON.stringify(draft) } }],
};
const purchase = (n = 1) => ({
  checkout: `cs_live_OfflineFixture${n}`, payment: `pi_OfflineFixture${n}`,
  email: `tester${n}@example.test`, paid: true, amount: 499, currency: "usd",
});
const readingRequest = (overrides) => ({ id: randomUUID(), input: question, mode: "pattern", consent: true, ...overrides });
const errorCode = (code) => ({ code });

async function fixture(t, monthlyUsd = "5") {
  const dir = await mkdtemp(join(tmpdir(), "eidomancer-web-"));
  const database = join(dir, "ledger.sqlite");
  let now = Date.parse("2026-11-11T12:00:00Z");
  const options = { database, key, clock: () => now };
  const ledger = openLedger({ ...options, initialize: true });
  const budget = createSpendBudget({ database, monthlyUsd, model: candidateModel, clock: () => new Date(now) });
  const calls = [];
  const provider = {
    moderations: { create: async ({ input }) => {
      calls.push("moderation");
      return { results: [{ flagged: input.includes("fixture blocked") }] };
    } },
    chat: { completions: { create: async (request) => {
      calls.push(request);
      return fake.complete(request);
    } } },
  };
  const fake = { complete: async () => good };
  const app = createPilotApp({ ledger, budget, provider, origin, support: "help@example.test" });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const root = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    budget.close();
    ledger.close();
    await rm(dir, { recursive: true, force: true });
  });
  const post = (route, body = {}, cookie = "", headers = {}) => fetch(`${root}/api/pilot/${route}`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie, ...headers },
    body: JSON.stringify(body),
  });
  async function enter(code) {
    const res = await post("access", { code });
    assert.equal(res.status, 200);
    const set = res.headers.get("set-cookie");
    assert.match(set, /^__Host-eidomancer_pilot=.+; Max-Age=604800; Path=\/; Expires=.+; HttpOnly; Secure; SameSite=Strict$/);
    assert.equal(res.headers.get("cache-control"), "no-store");
    return { cookie: set.split(";")[0], ...(await res.json()) };
  }
  const raw = (cookie) => cookie.split("=")[1];
  return { dir, database, options, ledger, budget, root, fake, calls, post, enter, raw,
    advance: (ms) => { now += ms; } };
}

test("owner grant validates payment claims, enforces ten distinct purchases, and never opens an HTTP grant route", async (t) => {
  const { ledger, post } = await fixture(t);
  for (const overrides of [{ amount: 500 }, { currency: "eur" }, { paid: false }, { checkout: "cs_test_fixture" }]) {
    assert.throws(() => ledger.grant({ ...purchase(), ...overrides }), errorCode("PAYMENT"));
  }
  ledger.grant(purchase());
  assert.throws(() => ledger.grant(purchase()), errorCode("DUPLICATE"));
  assert.throws(() => ledger.grant({ ...purchase(2), payment: purchase().payment }), errorCode("DUPLICATE"));
  assert.throws(() => ledger.grant({ ...purchase(2), email: " TESTER1@EXAMPLE.TEST " }), errorCode("DUPLICATE"));
  for (let n = 2; n <= 10; n++) ledger.grant(purchase(n));
  ledger.revoke(ledger.list()[0].id);
  assert.throws(() => ledger.grant(purchase(11)), errorCode("COHORT"));
  assert.equal((await post("grant", purchase(11))).status, 404);
});

test("cookie access, cross-origin rejection, restoration, logout, rotation and revocation", async (t) => {
  const { ledger, post, enter, calls } = await fixture(t);
  const order = ledger.grant(purchase());
  assert.equal((await post("access", { code: order.code }, "", { Origin: "https://attacker.test" })).status, 403);
  assert.equal((await post("access", { code: order.code }, "", { "Sec-Fetch-Site": "same-site" })).status, 403);
  assert.equal((await post("access", { code: order.code }, "", { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await post("readings", readingRequest())).status, 401);
  assert.equal(calls.length, 0);
  const first = await enter(order.code);
  const other = await enter(order.code);
  assert.equal(other.remaining, 5);
  assert.deepEqual(await (await post("balance", {}, first.cookie)).json(), { remaining: null });
  assert.equal((await post("readings", readingRequest({ consent: false }), other.cookie)).status, 400);
  assert.equal(calls.length, 0);
  const signout = await post("logout", {}, other.cookie);
  assert.match(signout.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Strict/);
  assert.equal((await post("readings", readingRequest(), other.cookie)).status, 401);
  assert.throws(() => ledger.rotate(order.id, "wrong@example.test"), errorCode("RECOVER"));
  const before = await enter(order.code);
  const replacement = ledger.rotate(order.id, purchase().email);
  assert.equal((await post("access", { code: order.code })).status, 401);
  assert.equal((await post("readings", readingRequest(), before.cookie)).status, 401);
  const after = await enter(replacement.code);
  ledger.revoke(order.id);
  assert.equal((await post("access", { code: replacement.code })).status, 401);
  assert.equal((await post("readings", readingRequest(), after.cookie)).status, 401);
  assert.equal(calls.length, 0);
});

test("in-flight conflicts, idempotent replays, restart, five-reading exhaustion and one-time recredit", async (t) => {
  const { ledger, post, enter, calls, fake, options, raw } = await fixture(t);
  const order = ledger.grant(purchase());
  const { cookie } = await enter(order.code);
  const request = readingRequest();
  let unblock;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  fake.complete = async () => {
    entered();
    await new Promise((resolve) => { unblock = resolve; });
    return good;
  };
  const first = post("readings", request, cookie);
  await started;
  for (const duplicate of [request, readingRequest()]) {
    const response = await post("readings", duplicate, cookie);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "PENDING");
  }
  unblock();
  const result = await (await first).json();
  assert.equal(result.remaining, 4);
  assert.equal(result.reading.title, draft.imagery.title);
  assert.ok(fields.every((field) => typeof result.reading[field] === "string"));
  assert.match(calls[1].messages[0].content, /Situated Valuation/);
  assert.equal(calls[1].service_tier, "default");
  assert.deepEqual(await (await post("readings", request, cookie)).json(), result);
  const mismatch = await post("readings", { ...request, input: "I submitted a different question." }, cookie);
  assert.equal((await mismatch.json()).code, "MISMATCH");
  assert.equal(calls.length, 3);

  const restarted = openLedger(options);
  try { assert.deepEqual(restarted.begin(raw(cookie), request), result); }
  finally { restarted.close(); }

  fake.complete = async () => good;
  for (let i = 3; i >= 0; i--) assert.equal((await (await post("readings", readingRequest(), cookie)).json()).remaining, i);
  assert.equal((await (await post("readings", readingRequest(), cookie)).json()).code, "EXHAUSTED");
  assert.equal(calls.length, 15);
  assert.equal((await enter(order.code)).remaining, 0);
  ledger.recredit(order.id, request.id);
  assert.throws(() => ledger.recredit(order.id, request.id), errorCode("RECREDIT"));
  const newSession = await enter(order.code);
  assert.equal(newSession.remaining, 1);
  assert.equal((await (await post("readings", request, newSession.cookie)).json()).code, "EXPIRED");
});

test("moderation, malformed output and provider timeouts release the credit while unknown provider spend stays held", async (t) => {
  const { ledger, enter, post, fake, database } = await fixture(t);
  const order = ledger.grant(purchase());
  const { cookie } = await enter(order.code);
  const blocked = await post("readings", readingRequest({ input: "fixture blocked by moderation" }), cookie);
  assert.equal(blocked.status, 422);
  const request = readingRequest();
  fake.complete = async () => ({ ...good, choices: [] });
  assert.equal((await post("readings", request, cookie)).status, 502);
  fake.complete = async () => { throw new Error("offline simulated timeout"); };
  assert.equal((await post("readings", request, cookie)).status, 503);
  assert.deepEqual(await (await post("balance", {}, cookie)).json(), { remaining: 5 });
  const inspection = new DatabaseSync(database);
  try {
    assert.equal(inspection.prepare("SELECT reserved_nanos FROM mobile_monthly_spend").get().reserved_nanos, 308_625_000);
    assert.equal(inspection.prepare("SELECT count(*) AS n FROM pilot_requests").get().n, 0);
  } finally { inspection.close(); }
  fake.complete = async () => good;
  assert.equal((await (await post("readings", request, cookie)).json()).remaining, 4);
});

test("spend cap blocks generation without a debit, and failed ledger access blocks all provider calls", async (t) => {
  const { ledger, enter, post, calls, database } = await fixture(t, "0");
  const order = ledger.grant(purchase());
  const { cookie } = await enter(order.code);
  const response = await post("readings", readingRequest(), cookie);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "BUDGET");
  assert.deepEqual(calls, ["moderation"]);
  assert.deepEqual(await (await post("balance", {}, cookie)).json(), { remaining: 5 });
  assert.throws(() => openLedger({ database: `${database}.missing`, key }), /missing/);
  assert.throws(() => openLedger({ database, key: Buffer.alloc(32) }), /does not match/);
  const db = new DatabaseSync(database);
  db.exec("DROP TABLE pilot_requests");
  db.close();
  assert.equal((await post("readings", readingRequest(), cookie)).status, 503);
  assert.deepEqual(calls, ["moderation"]);
});

test("revocation during generation discards output and cannot debit the purchase", async (t) => {
  const { ledger, enter, post, fake } = await fixture(t);
  const order = ledger.grant(purchase());
  const { cookie } = await enter(order.code);
  fake.complete = async () => {
    ledger.revoke(order.id);
    return good;
  };
  assert.equal((await post("readings", readingRequest(), cookie)).status, 401);
  assert.equal(ledger.list()[0].used, 0);
  assert.deepEqual(ledger.requests(order.id), []);
});

test("owner crash recovery cannot clear a fresh request or settle an older attempt", async (t) => {
  const { ledger, options, advance } = await fixture(t);
  const order = ledger.grant(purchase());
  const { raw } = ledger.exchange(order.code);
  const request = readingRequest();
  const old = ledger.begin(raw, request);
  const restarted = openLedger(options);
  try {
    assert.throws(() => restarted.begin(raw, request), errorCode("PENDING"));
    assert.throws(() => restarted.clearPending(order.id), errorCode("PENDING"));
    advance(120_001);
    restarted.clearPending(order.id);
    const current = restarted.begin(raw, request);
    assert.equal(ledger.finish(old, raw, { title: "Late attempt" }), null);
    assert.equal(restarted.finish(current, raw, { title: "Current attempt" }).remaining, 4);
    advance(day);
    restarted.purge();
    assert.throws(() => restarted.begin(raw, request), errorCode("EXPIRED"));
  } finally { restarted.close(); }
});

test("owner CLI restores a quarantined SQLite snapshot, invalidates access and fails closed on stale spend", async (t) => {
  const { ledger, dir, database, enter, post } = await fixture(t);
  const order = ledger.grant(purchase());
  const { cookie } = await enter(order.code);
  const request = readingRequest();
  await post("readings", request, cookie);
  const backup = join(dir, "backup.sqlite");
  await ledger.backupTo(backup);
  const bytes = await readFile(backup);
  for (const secret of [order.code, cookie.split("=")[1], question, draft.imagery.title, purchase().email]) {
    assert.equal(bytes.includes(secret), false);
  }
  const restored = join(dir, "restored.sqlite");
  const cli = (destination, ...args) => spawnSync(process.execPath, ["mobile/web/server/owner.js", ...args], {
    env: { ...process.env, WEB_PILOT_DATABASE: destination, WEB_PILOT_KEY: key.toString("hex") },
    encoding: "utf8",
  });
  assert.equal(cli(database, "restore", backup).status, 1);
  const command = cli(restored, "restore", backup);
  assert.equal(command.status, 0, command.stderr);
  const recovered = openLedger({ database: restored, key });
  const spend = createSpendBudget({ database: restored, model: candidateModel, monthlyUsd: "5" });
  try {
    assert.equal(recovered.recovering(), true);
    assert.throws(() => recovered.grant(purchase(2)), errorCode("RECOVERY"));
    assert.throws(() => recovered.resume(), errorCode("REVIEW"));
    recovered.reconcile(order.id, 4);
    recovered.resume();
    assert.throws(() => recovered.exchange(order.code), errorCode("ACCESS"));
    const replacement = recovered.rotate(order.id, purchase().email);
    assert.equal(recovered.exchange(replacement.code).remaining, 4);
    await assert.rejects(spend.complete({ model: candidateModel, max_completion_tokens: 1050 },
      () => assert.fail("Snapshot recovery must not reset the cap")), MonthlySpendLimitError);
  } finally { spend.close(); recovered.close(); }
});

test("trusted shell grant, recovery and revoke work without payment or model credentials", async (t) => {
  const { database, ledger } = await fixture(t);
  const cli = (args, input) => spawnSync(process.execPath, ["mobile/web/server/owner.js", ...args], {
    env: { ...process.env, WEB_PILOT_DATABASE: database, WEB_PILOT_KEY: key.toString("hex") },
    input: input === undefined ? undefined : JSON.stringify(input),
    encoding: "utf8",
  });
  const granted = cli(["grant"], purchase());
  assert.equal(granted.status, 0, granted.stderr);
  const { id, code } = JSON.parse(granted.stdout);
  const session = ledger.exchange(code);
  assert.equal(session.remaining, 5);
  assert.equal(cli(["grant"], purchase()).status, 1);
  const replacement = cli(["rotate", id], { email: purchase().email });
  assert.equal(replacement.status, 0, replacement.stderr);
  assert.equal(ledger.balance(session.raw).remaining, null);
  assert.throws(() => ledger.exchange(code), errorCode("ACCESS"));
  const updated = ledger.exchange(JSON.parse(replacement.stdout).code);
  assert.equal(updated.remaining, 5);
  assert.equal(cli(["revoke", id]).status, 0);
  assert.equal(ledger.balance(updated.raw).remaining, null);
});
