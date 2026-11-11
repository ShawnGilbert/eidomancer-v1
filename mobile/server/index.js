import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { access, mkdir } from "node:fs/promises";
import { constants, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMobileApi } from "./api.js";
import { createEntitlements } from "./entitlements.js";
import { appleVerifier, playVerifier } from "./store-proof.js";

const {
  OPENAI_API_KEY, MOBILE_REPORT_KEY, MOBILE_REPORT_DIR, MOBILE_SUPPORT_EMAIL,
  MOBILE_MODEL = "gpt-4.1-mini", PORT = 3002, MOBILE_TRUST_PROXY_HOPS = 0,
  MOBILE_READINGS_PER_IP_HOUR = 60, MOBILE_READINGS_PER_DAY = 400, MOBILE_REPORTS_PER_DAY = 400,
  MOBILE_ACCESS_MODE = "production", MOBILE_ENTITLEMENT_KEY, MOBILE_ENTITLEMENT_DB,
  MOBILE_PLAY_LICENSE_KEY, MOBILE_PLAY_VERSIONS = "1", MOBILE_APPLE_TEAM_ID,
  MOBILE_APPLE_APP_ID, MOBILE_APPLE_ROOT_FILES, MOBILE_INSTALL_DAILY = 3,
  MOBILE_OWNER_DAILY = 5, MOBILE_OWNER_LIFETIME = 250, MOBILE_DEVICE_SLOTS = 3,
} = process.env;

const reportKey = Buffer.from(MOBILE_REPORT_KEY || "", "hex");
if (!OPENAI_API_KEY || !/^[a-f0-9]{64}$/i.test(MOBILE_REPORT_KEY || "") ||
    !MOBILE_REPORT_DIR || !/^[a-z0-9._+%-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(MOBILE_SUPPORT_EMAIL || "")) {
  throw new Error("Configure the server API key, 32-byte hex report key, persistent report directory, and support email.");
}
const [perIp, perDay, reportDailyLimit, proxyHops] = [
  MOBILE_READINGS_PER_IP_HOUR, MOBILE_READINGS_PER_DAY, MOBILE_REPORTS_PER_DAY, MOBILE_TRUST_PROXY_HOPS,
].map(Number);
if (![perIp, perDay, reportDailyLimit].every((value) => Number.isSafeInteger(value) && value > 0) ||
    !Number.isSafeInteger(proxyHops) || proxyHops < 0) throw new Error("Invalid mobile server limits.");

await mkdir(MOBILE_REPORT_DIR, { recursive: true, mode: 0o700 });
await access(MOBILE_REPORT_DIR, constants.W_OK);
const local = MOBILE_ACCESS_MODE === "local";
if (!["local", "sandbox", "production"].includes(MOBILE_ACCESS_MODE) ||
    (local && (process.env.RENDER || process.env.NODE_ENV === "production"))) {
  throw new Error("Invalid access mode. Local mode is limited to loopback development.");
}

let entitlements;
if (!local) {
  if (!/^[a-f0-9]{64}$/i.test(MOBILE_ENTITLEMENT_KEY || "") ||
      !MOBILE_ENTITLEMENT_DB || !path.isAbsolute(MOBILE_ENTITLEMENT_DB) ||
      !MOBILE_PLAY_LICENSE_KEY || !/^[A-Z0-9]{10}$/.test(MOBILE_APPLE_TEAM_ID || "") ||
      !/^[1-9][0-9]*$/.test(MOBILE_APPLE_APP_ID || "") ||
      !Number.isSafeInteger(Number(MOBILE_APPLE_APP_ID)) || !MOBILE_APPLE_ROOT_FILES) {
    throw new Error("Configure the persistent entitlement database and store proof settings.");
  }
  const limits = {
    installDaily: Number(MOBILE_INSTALL_DAILY), ownerDaily: Number(MOBILE_OWNER_DAILY),
    ownerLifetime: Number(MOBILE_OWNER_LIFETIME), devices: Number(MOBILE_DEVICE_SLOTS), globalDaily: perDay,
  };
  if (!Object.values(limits).every((value) => Number.isSafeInteger(value) && value > 0) ||
      !/^\d+(,\d+)*$/.test(MOBILE_PLAY_VERSIONS)) throw new Error("Invalid entitlement limits or Play versions.");
  const sandbox = MOBILE_ACCESS_MODE === "sandbox";
  const database = MOBILE_ENTITLEMENT_DB + (sandbox ? ".sandbox" : "");
  await mkdir(path.dirname(database), { recursive: true, mode: 0o700 });
  entitlements = createEntitlements({
    database, key: Buffer.from(MOBILE_ENTITLEMENT_KEY, "hex"), limits,
    verifyPlay: playVerifier(MOBILE_PLAY_LICENSE_KEY, MOBILE_PLAY_VERSIONS.split(",")),
    verifyApple: appleVerifier({
      roots: MOBILE_APPLE_ROOT_FILES.split(",").map((file) => readFileSync(file)),
      appId: Number(MOBILE_APPLE_APP_ID), teamIdentifier: MOBILE_APPLE_TEAM_ID, sandbox,
    }),
  });
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", proxyHops);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/privacy", (_req, res) => {
  res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Eidomancer privacy and support</title>
  <main><h1>Eidomancer privacy and support</h1>
  <p>Daily Signal runs on your device. Eidomancer does not require an account or save reading history in the app.</p>
  <p>When you give permission, Eidomancer sends the text you enter to its server and to OpenAI for moderation and to generate your reading. Leave out identifying details. OpenAI processes the request according to its <a href="https://platform.openai.com/docs/guides/your-data">API data controls</a>.</p>
  <p>Store verification uses signed store proof and a random installation identifier. We retain a protected purchase identifier, installation access records, and reading counts to enforce the shared allowance, restore access, and limit abuse. We do not receive your store password or payment information. You can withdraw AI reading permission in the app.</p>
  <p>The reading service processes IP addresses temporarily to limit abuse. Network and infrastructure providers may process connection information as part of delivering the service.</p>
  <p>If you report a reading, Eidomancer stores the generated text, your selected reason, and technical details of the reading for investigation. Contact support for privacy inquiries or to request removal of reported material.</p>
  <p>For support or privacy inquiries, email <a href="mailto:${MOBILE_SUPPORT_EMAIL}">${MOBILE_SUPPORT_EMAIL}</a>.</p>
  </main></html>`);
});
app.use("/api/mobile", createMobileApi({
  client: new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 0 }),
  reportKey, reportDir: MOBILE_REPORT_DIR, model: MOBILE_MODEL, perIp, perDay, reportDailyLimit, entitlements,
}));
app.use(express.static(fileURLToPath(new URL("../dist/", import.meta.url))));
app.listen(Number(PORT), local ? "127.0.0.1" : "0.0.0.0", () => console.log(`Eidomancer mobile service listening on ${PORT}`));
