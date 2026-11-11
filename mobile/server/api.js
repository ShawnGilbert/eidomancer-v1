import cors from "cors";
import express from "express";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { experiences } from "../src/content.js";
import { MonthlySpendLimitError } from "./spend-budget.js";
import { generateReading } from "./reading.js";

const reportReasons = new Set(["unsafe", "offensive", "misleading", "other"]);
const unavailable = "The reading service is temporarily unavailable. Try again shortly.";
const hour = 3600000;
const day = 24 * hour;

export function createMobileApi({ client, reportKey, reportDir, model, perIp, perDay, reportDailyLimit, entitlements }) {
  const router = express.Router();
  const requestCounts = new Map();
  let readDay = 0;
  let readCount = 0;
  let reportDay = 0;
  let reportCount = 0;
  let active = 0;
  let nextSweep = 0;

  function allow(ip, route) {
    const now = Date.now();
    if (now >= nextSweep) {
      for (const [key, value] of requestCounts) {
        if (value.expires <= now) requestCounts.delete(key);
      }
      nextSweep = now + 60000;
    }
    const key = `${route}:${ip}`;
    const existing = requestCounts.get(key);
    if (existing?.expires > now) return ++existing.count <= perIp;
    if (requestCounts.size >= 10000) return false;
    requestCounts.set(key, { count: 1, expires: now + hour });
    return true;
  }

  function seal(reading, mode) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", reportKey, nonce);
    const { evidence: _evidence, ...reportReading } = reading;
    const payload = { id: randomUUID(), expires: Date.now() + 7 * day, reading: reportReading, mode, model };
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
    return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64url");
  }

  function open(token) {
    try {
      const bytes = Buffer.from(token, "base64url");
      const decipher = createDecipheriv("aes-256-gcm", reportKey, bytes.subarray(0, 12));
      decipher.setAuthTag(bytes.subarray(12, 28));
      const payload = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]));
      return payload.expires >= Date.now() ? payload : null;
    } catch {
      return null;
    }
  }

  router.use(cors({ origin: ["capacitor://localhost", "https://localhost"] }));
  router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.use(express.json({ limit: "32kb" }));

  if (entitlements) {
    router.post("/entitlements/challenge", (req, res) => {
      if (!allow(req.ip, "challenge")) return res.status(429).json({ error: "Try again later." });
      const challenge = entitlements.challenge(req.body ?? {});
      return challenge ? res.json(challenge) : res.status(400).json({ error: "Couldn’t start store verification." });
    });

    router.post("/entitlements/verify", async (req, res) => {
      if (!allow(req.ip, "verify")) return res.status(429).json({ error: "Try again later." });
      try {
        const session = await entitlements.redeem(req.body ?? {});
        if (session) return res.json(session);
      } catch (error) {
        console.warn("Store verification failed", { name: error?.name, status: error?.status });
      }
      return res.status(403).json({ error: "Couldn’t verify store access. Open the app with the account you used to get it." });
    });
  }

  router.post("/readings", async (req, res) => {
    const { input, mode, consent } = req.body ?? {};
    if (consent !== true || typeof mode !== "string" || !Object.hasOwn(experiences, mode) ||
        typeof input !== "string" || input.trim().length < 10 || input.length > 1800) {
      return res.status(400).json({ error: "Enter 10 to 1,800 characters and agree to send your text." });
    }
    if (!allow(req.ip, "reading")) {
      return res.status(429).json({ error: "You’ve reached the hourly reading limit. Try again later." });
    }
    const currentDay = Math.floor(Date.now() / day);
    if (readDay !== currentDay) { readDay = currentDay; readCount = 0; }
    if ((!entitlements && readCount >= perDay) || active >= 8) {
      return res.status(429).json({ error: "Readings are at capacity. Try again later." });
    }

    let reservation;
    let delivered = false;
    if (entitlements) {
      let access;
      try { access = entitlements.reserve(req.get("authorization")); }
      catch { return res.status(503).json({ error: unavailable }); }
      if (access === "unlicensed") return res.status(401).json({ error: "Verify store access to continue." });
      if (access === "limited") return res.status(429).json({ error: "This reading allowance has been reached." });
      reservation = access;
    } else {
      readCount++;
    }
    active++;
    try {
      const { reading, usage, status, error } = await generateReading({ client, input: input.trim(), mode, model });
      if (usage) console.info("Mobile model usage", {
        model, inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens,
      });
      if (!reading) return res.status(status).json({ error });
      const reportToken = seal(reading, mode);
      delivered = true;
      return res.json({ reading, reportToken });
    } catch (error) {
      if (error instanceof MonthlySpendLimitError) {
        return res.status(503).json({ error: "This month’s AI reading budget is used up. Daily Signal and Echo Journal are available offline." });
      }
      console.warn("Mobile reading failed", { name: error?.name, status: error?.status });
      return res.status(503).json({ error: unavailable });
    } finally {
      active--;
      if (!delivered && reservation) {
        try { reservation.refund(); }
        catch (error) { console.warn("Unable to restore a reading allowance", { name: error?.name }); }
      }
    }
  });

  router.post("/reports", async (req, res) => {
    const { token, reason } = req.body ?? {};
    if (!reportReasons.has(reason) || typeof token !== "string" || token.length > 20000) {
      return res.status(400).json({ error: "Choose a report reason." });
    }
    if (!allow(req.ip, "report")) return res.status(429).json({ error: "Try again later." });
    const payload = open(token);
    if (!payload) return res.status(400).json({ error: "This report link has expired or is invalid." });
    const currentDay = Math.floor(Date.now() / day);
    if (reportDay !== currentDay) { reportDay = currentDay; reportCount = 0; }
    if (reportCount >= reportDailyLimit) return res.status(429).json({ error: "Try again later." });
    reportCount++;
    const { id, reading, mode, model: readingModel } = payload;
    const report = { id, reading, mode, model: readingModel, reason, submittedAt: new Date().toISOString() };
    try {
      await mkdir(reportDir, { recursive: true, mode: 0o700 });
      await writeFile(path.join(reportDir, `${id}.json`), JSON.stringify(report), { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code !== "EEXIST") return res.status(503).json({ error: "Couldn’t store this report. Try again." });
    }
    return res.status(201).json({ received: true });
  });

  router.use((error, _req, res, _next) => {
    res.status(error.status === 413 ? 413 : 400).json({ error: "The request could not be read." });
  });
  return router;
}
