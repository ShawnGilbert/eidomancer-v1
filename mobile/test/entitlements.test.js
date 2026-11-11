import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createEntitlements } from "../server/entitlements.js";
import { playVerifier } from "../server/store-proof.js";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const verifyPlay = playVerifier(publicKey.export({ type: "spki", format: "der" }).toString("base64"), ["1"]);

function signed(challenge, now, options = {}) {
  const { code = 0, nonce = challenge.nonce, owner = "owner-a", version = "1", bundle = "com.eidomancer.app",
    issued = now, expires = now + 86400000 } = options;
  const signedData = `${code}|${nonce}|${bundle}|${version}|${owner}|${issued}:VT=${expires}`;
  return { signedData, signature: sign("RSA-SHA1", Buffer.from(signedData), privateKey).toString("base64") };
}

test("Play verification rejects wrong nonce, package, version, unlicensed, expired and tampered proof", () => {
  const now = Date.now();
  const challenge = { nonce: 123, created: now };
  assert.equal(verifyPlay(signed(challenge, now), challenge, now).owner, "owner-a");
  for (const changes of [{ nonce: 124 }, { bundle: "different.app" }, { version: "2" }, { code: 1 },
    { expires: now - 1 }, { issued: now - 60000 }]) {
    assert.equal(verifyPlay(signed(challenge, now, changes), challenge, now), null);
  }
  const altered = signed(challenge, now);
  altered.signedData = altered.signedData.replace("owner-a", "owner-b");
  assert.equal(verifyPlay(altered, challenge, now), null);
});

test("purchase limits survive restart and reinstall, and a store proof can be redeemed only once", async (t) => {
  const folder = mkdtempSync(path.join(tmpdir(), "eidomancer-quota-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  let now = Date.now();
  const settings = {
    database: path.join(folder, "limits.sqlite"), key: Buffer.alloc(32, 9), verifyPlay, clock: () => now,
    limits: { installDaily: 1, ownerDaily: 2, ownerLifetime: 3, devices: 2, globalDaily: 50 },
  };
  let access = createEntitlements(settings);
  t.after(() => access.close());
  async function enroll(install = randomUUID()) {
    const challenge = access.challenge({ platform: "android", install });
    const body = { id: challenge.id, proof: signed(challenge, now) };
    const session = await access.redeem(body);
    assert.ok(session);
    assert.equal(await access.redeem(body), null);
    return "Bearer " + session.token;
  }
  const first = await enroll();
  now++;
  const second = await enroll();
  assert.equal(typeof access.reserve(first).refund, "function");
  assert.equal(access.reserve(first), "limited");
  assert.equal(typeof access.reserve(second).refund, "function");
  access.close();
  access = createEntitlements(settings);
  now++;
  const restored = await enroll();
  assert.equal(access.reserve(restored), "limited");
  assert.equal(access.reserve(first), "unlicensed");
  now += 86400000;
  assert.equal(access.reserve(second), "unlicensed");
  assert.equal(typeof access.reserve(await enroll()).refund, "function");
  now += 86400000;
  assert.equal(access.reserve(await enroll()), "limited");
});

test("parallel iOS renewal cannot move an installation assertion counter backwards", async () => {
  const access = createEntitlements({
    database: ":memory:", key: Buffer.alloc(32, 8),
    limits: { installDaily: 2, ownerDaily: 3, ownerLifetime: 10, devices: 3, globalDaily: 20 },
    verifyApple: async ({ signCount }, _challenge, previous) => ({
      owner: "apple-owner", keyId: "attest-key", publicKey: previous?.publicKey || "test-public-key", signCount,
    }),
  });
  try {
    const install = randomUUID();
    const enroll = (signCount) => access.redeem({
      id: access.challenge({ platform: "ios", install }).id, proof: { signCount },
    });
    assert.ok(await enroll(0));
    const [first, replay] = await Promise.all([enroll(1), enroll(1)]);
    assert.ok(first);
    assert.equal(replay, null);
  } finally { access.close(); }
});
