import express from "express";
import { experiences } from "../../src/content.js";
import { generateReading } from "../../server/reading.js";
import { MonthlySpendLimitError } from "../../server/spend-budget.js";
import { candidateModel } from "../../server/model-rates.js";
import { PilotError } from "./ledger.js";

const cookie = "__Host-eidomancer_pilot";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const cookieOptions = { secure: true, httpOnly: true, sameSite: "strict", path: "/" };

function session(req) {
  const matches = (req.get("cookie") || "").split(";").map((part) => part.trim())
    .filter((part) => part.startsWith(cookie + "="));
  return matches.length === 1 ? matches[0].slice(cookie.length + 1) : undefined;
}

export function createPilotApp({ ledger, budget, provider, origin, support, assets, proxyHops = 0 }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", proxyHops);
  app.use((_req, res, next) => {
    res.set({
      "Content-Security-Policy": "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    });
    next();
  });
  const client = {
    moderations: provider.moderations,
    chat: { completions: { create: (request, options) =>
      budget.complete(request, (metered) => provider.chat.completions.create(metered, options)),
    } },
  };
  const router = express.Router();
  const rates = new Map();
  let swept = 0;
  function limit(req, route, max) {
    const window = Math.floor(Date.now() / 3_600_000);
    if (window !== swept) { rates.clear(); swept = window; }
    const key = `${route}:${req.ip}`;
    const count = rates.get(key) ?? 0;
    if (count >= max || (!count && rates.size >= 5000)) throw new PilotError(429, "RATE", "Too many attempts. Try again later.");
    rates.set(key, count + 1);
  }
  let active = 0;
  router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.use((req, _res, next) => {
    if (req.method !== "POST") return next();
    if (req.get("origin") !== origin || (req.get("sec-fetch-site") && req.get("sec-fetch-site") !== "same-origin")) {
      return next(new PilotError(403, "ORIGIN", "This request must come from the Eidomancer pilot."));
    }
    if (!req.is("application/json")) return next(new PilotError(415, "TYPE", "Send JSON."));
    next();
  });
  router.use(express.json({ limit: "8kb" }));
  router.get("/info", (_req, res) => res.json({ support }));
  router.post("/access", (req, res) => {
    limit(req, "access", 12);
    const { raw, maxAge, remaining } = ledger.exchange(req.body?.code);
    res.cookie(cookie, raw, { ...cookieOptions, maxAge }).json({ remaining });
  });
  router.post("/balance", (req, res) => {
    limit(req, "balance", 120);
    res.json(ledger.balance(session(req)));
  });
  router.post("/logout", (req, res) => {
    ledger.logout(session(req));
    res.clearCookie(cookie, cookieOptions).json({ remaining: null });
  });
  router.post("/readings", async (req, res, next) => {
    let reservation;
    let generating = false;
    const raw = session(req);
    try {
      limit(req, "reading", 40);
      const { input, mode, consent, id } = req.body ?? {};
      if (consent !== true || typeof id !== "string" || !uuid.test(id) ||
          typeof mode !== "string" || !Object.hasOwn(experiences, mode) ||
          typeof input !== "string" || input.length > 1800 || input.trim().length < 10) {
        throw new PilotError(400, "INPUT", "Enter 10 to 1,800 characters and agree to send your text.");
      }
      if (active >= 3) throw new PilotError(429, "BUSY", "Readings are at capacity. Try again shortly.");
      reservation = ledger.begin(raw, { id, mode, input: input.trim() });
      if (reservation.reading) return res.json(reservation);
      active++;
      generating = true;
      const result = await generateReading({ client, input: input.trim(), mode, model: candidateModel });
      const delivered = ledger.finish(reservation, raw, result.reading);
      if (!result.reading) return res.status(result.status).json({ code: "GENERATION", error: result.error });
      if (!delivered) throw new PilotError(401, "ACCESS", "Your access changed while this reading was generating. Enter your current code to continue.");
      return res.json(delivered);
    } catch (error) {
      if (generating) {
        // Attempt-specific cleanup cannot remove a committed result or a newer retry.
        try { ledger.finish(reservation, raw); } catch { /* Leave the reservation for owner review. */ }
      }
      return next(error);
    } finally {
      if (generating) active--;
    }
  });
  router.use((_req, res) => res.status(404).json({ error: "Pilot route not found." }));
  router.use((error, _req, res, _next) => {
    if (error instanceof PilotError) return res.status(error.status).json({ code: error.code, error: error.message });
    if (error instanceof MonthlySpendLimitError) return res.status(503).json({ code: "BUDGET", error: "Personalized readings are paused at the monthly AI limit. Daily Signal and your journal remain available." });
    if (error.type === "entity.too.large" || error.type === "entity.parse.failed") {
      return res.status(error.status).json({ error: "This request could not be read." });
    }
    console.warn("Pilot request unavailable", { name: error?.name });
    return res.status(503).json({ code: "UNAVAILABLE", error: "The reading service is temporarily unavailable. Retry the same question or contact support." });
  });
  app.use("/api/pilot", router);
  app.get("/health", (_req, res) => {
    try {
      const recovery = ledger.recovering();
      res.set("Cache-Control", "no-store").status(recovery ? 503 : 200).json({ ok: !recovery });
    } catch {
      res.set("Cache-Control", "no-store").status(503).json({ ok: false });
    }
  });
  if (assets) app.use(express.static(assets, { dotfiles: "deny", setHeaders(res, file) {
    if (file.endsWith("sw.js") || file.endsWith("index.html")) res.set("Cache-Control", "no-cache");
  } }));
  return app;
}
