// Standard text rates in nano-USD per token. Cached input is charged at the
// uncached rate for conservative budget accounting.
export const candidateModel = "gpt-5.4-mini-2026-03-17";
export const completionLimit = 1050;
const candidateRates = { input: 750, output: 4500, context: 400_000 };
const legacyRates = { input: 400, output: 1600 };

export function modelRates(model) {
  if (model === candidateModel) return candidateRates;
  if (model === "gpt-4.1-mini" || model === "gpt-4.1-mini-2025-04-14") return legacyRates;
  return null;
}

export function generationCostNanos(rates, usage) {
  const input = usage?.prompt_tokens;
  const output = usage?.completion_tokens;
  if (!rates || !Number.isSafeInteger(input) || input <= 0 ||
      !Number.isSafeInteger(output) || output < 0) return null;
  const amount = input * rates.input + output * rates.output;
  return Number.isSafeInteger(amount) ? amount : null;
}
