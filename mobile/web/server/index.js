import OpenAI from "openai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createSpendBudget } from "../../server/spend-budget.js";
import { candidateModel } from "../../server/model-rates.js";
import { openLedger } from "./ledger.js";
import { createPilotApp } from "./app.js";

const {
  WEB_PILOT_ENABLE, WEB_PILOT_DATABASE, WEB_PILOT_KEY, WEB_PILOT_ORIGIN, WEB_PILOT_SUPPORT,
  WEB_PILOT_TRUST_PROXY_HOPS = "0", WEB_PILOT_MONTHLY_API_BUDGET_USD = "5", OPENAI_API_KEY, PORT = "3002",
} = process.env;
if (WEB_PILOT_ENABLE !== "true" || !OPENAI_API_KEY) throw new Error("Live web readings require explicit enablement and a project API key.");
const origin = new URL(WEB_PILOT_ORIGIN);
if (origin.protocol !== "https:" || origin.origin !== WEB_PILOT_ORIGIN ||
    !/^[a-z0-9._+%-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(WEB_PILOT_SUPPORT || "") ||
    !/^[a-f0-9]{64}$/i.test(WEB_PILOT_KEY || "") ||
    !/^[0-5](?:\.\d{1,2})?$/.test(WEB_PILOT_MONTHLY_API_BUDGET_USD) ||
    Number(WEB_PILOT_MONTHLY_API_BUDGET_USD) > 5 || !/^[0-3]$/.test(WEB_PILOT_TRUST_PROXY_HOPS) ||
    !/^\d{1,5}$/.test(PORT) || Number(PORT) < 1 || Number(PORT) > 65535) {
  throw new Error("Invalid pilot origin, support, ledger key, monthly cap, proxy hops, or port.");
}
const assets = fileURLToPath(new URL("../../dist-pilot/", import.meta.url));
readFileSync(new URL("../../dist-pilot/sw.js", import.meta.url));
const ledger = openLedger({ database: WEB_PILOT_DATABASE, key: Buffer.from(WEB_PILOT_KEY, "hex") });
const budget = createSpendBudget({ database: WEB_PILOT_DATABASE, monthlyUsd: WEB_PILOT_MONTHLY_API_BUDGET_USD, model: candidateModel });
const provider = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: "https://api.openai.com/v1", maxRetries: 0 });
const app = createPilotApp({ ledger, budget, provider, origin: origin.origin,
  support: WEB_PILOT_SUPPORT, assets, proxyHops: Number(WEB_PILOT_TRUST_PROXY_HOPS) });
const server = app.listen(Number(PORT), "0.0.0.0");
const cleanup = setInterval(() => {
  try { ledger.purge(); } catch (error) { console.warn("Pilot response purge failed", { name: error?.name }); }
}, 60_000).unref();
ledger.purge();
for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
  clearInterval(cleanup);
  server.close(() => { budget.close(); ledger.close(); });
});
