import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { createMobileApi } from "./api.js";

const {
  OPENAI_API_KEY, MOBILE_REPORT_KEY, MOBILE_REPORT_DIR, MOBILE_SUPPORT_EMAIL,
  MOBILE_MODEL = "gpt-4.1-mini", PORT = 3002, MOBILE_TRUST_PROXY_HOPS = 0,
  MOBILE_READINGS_PER_IP_HOUR = 12, MOBILE_READINGS_PER_DAY = 400, MOBILE_REPORTS_PER_DAY = 400,
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
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", proxyHops);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/privacy", (_req, res) => {
  res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Eidomancer privacy and support</title>
  <main><h1>Eidomancer privacy and support</h1>
  <p>Daily Signal runs on your device. Eidomancer does not require an account or save reading history in the app.</p>
  <p>When you give permission, Eidomancer sends the text you enter to its server and to OpenAI for moderation and to generate your reading. Leave out identifying details. OpenAI processes the request according to its <a href="https://platform.openai.com/docs/guides/your-data">API data controls</a>.</p>
  <p>The reading service processes IP addresses temporarily to limit abuse. Network and infrastructure providers may process connection information as part of delivering the service.</p>
  <p>If you report a reading, Eidomancer stores the generated text, your selected reason, and technical details of the reading for investigation. Contact support for privacy inquiries or to request removal of reported material.</p>
  <p>For support or privacy inquiries, email <a href="mailto:${MOBILE_SUPPORT_EMAIL}">${MOBILE_SUPPORT_EMAIL}</a>.</p>
  </main></html>`);
});
app.use("/api/mobile", createMobileApi({
  client: new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 0 }),
  reportKey, reportDir: MOBILE_REPORT_DIR, model: MOBILE_MODEL, perIp, perDay, reportDailyLimit,
}));
app.use(express.static(fileURLToPath(new URL("../dist/", import.meta.url))));
app.listen(PORT, () => console.log(`Eidomancer mobile service listening on ${PORT}`));
