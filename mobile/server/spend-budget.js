import { statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { candidateModel, completionLimit, generationCostNanos, modelRates } from "./model-rates.js";

export class MonthlySpendLimitError extends Error {}

function budgetNanos(usd) {
  if (typeof usd !== "string" || !/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(usd)) {
    throw new Error("MOBILE_MONTHLY_API_BUDGET_USD must be a decimal dollar amount with at most two decimal places.");
  }
  const [dollars, cents = ""] = usd.split(".");
  return Number(dollars) * 1_000_000_000 + Number(cents.padEnd(2, "0")) * 10_000_000;
}

export function createSpendBudget({ database, monthlyUsd, model, clock = () => new Date() }) {
  if (typeof database !== "string" || !path.isAbsolute(database) || model !== candidateModel) {
    throw new Error("Configure an absolute spend database path and an approved, pinned model.");
  }
  const limit = budgetNanos(monthlyUsd);
  if (!statSync(database, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("Initialize the spend database file on its persistent volume before starting the service.");
  }
  const rates = modelRates(model);
  const db = new DatabaseSync(database);
  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS mobile_monthly_spend (
        month TEXT PRIMARY KEY, reserved_nanos INTEGER NOT NULL CHECK (reserved_nanos >= 0)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS mobile_spend_halt (id INTEGER PRIMARY KEY CHECK (id = 1)) STRICT;
    `);
  } catch (error) {
    db.close();
    throw error;
  }

  const spent = db.prepare("SELECT reserved_nanos FROM mobile_monthly_spend WHERE month = ?");
  const add = db.prepare(`INSERT INTO mobile_monthly_spend VALUES (?, ?)
    ON CONFLICT(month) DO UPDATE SET reserved_nanos = reserved_nanos + excluded.reserved_nanos`);
  const refund = db.prepare("UPDATE mobile_monthly_spend SET reserved_nanos = reserved_nanos - ? WHERE month = ?");
  const halted = db.prepare("SELECT id FROM mobile_spend_halt WHERE id = 1");
  const halt = db.prepare("INSERT OR IGNORE INTO mobile_spend_halt VALUES (1)");

  return {
    async complete(request, send) {
      if (request.model !== model || request.stream || (request.n ?? 1) !== 1 ||
          !Number.isSafeInteger(request.max_completion_tokens) || request.max_completion_tokens <= 0 ||
          request.max_completion_tokens > completionLimit) {
        throw new Error("Completion is outside the metered model contract.");
      }

      // Reserve the published input context ceiling, not an estimate of the
      // prompt. A timeout or process crash leaves this reservation charged.
      const hold = rates.context * rates.input + request.max_completion_tokens * rates.output;
      const month = clock().toISOString().slice(0, 7);
      db.exec("BEGIN IMMEDIATE");
      try {
        const used = spent.get(month)?.reserved_nanos ?? 0;
        if (halted.get() || used > limit - hold) throw new MonthlySpendLimitError("Monthly AI spending limit reached.");
        add.run(month, hold);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      const completion = await send({ ...request, service_tier: "default" });
      const actual = generationCostNanos(rates, completion?.usage);
      if (completion?.model !== model || (completion.service_tier && completion.service_tier !== "default") ||
          (actual !== null && (actual > hold || completion.usage.prompt_tokens > rates.context ||
            completion.usage.completion_tokens > request.max_completion_tokens))) {
        halt.run();
        throw new Error("Provider completion exceeded the metered model contract.");
      }
      if (actual !== null) refund.run(hold - actual, month);
      return completion;
    },
    close() { db.close(); },
  };
}
