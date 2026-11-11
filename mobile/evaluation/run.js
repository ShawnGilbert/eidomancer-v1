import "dotenv/config";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { generateReading } from "../server/reading.js";
import { layers, readingPreviewLayer } from "../src/content.js";
import { liveCases } from "./live-cases.js";

const model = process.env.MOBILE_MODEL || "gpt-4.1-mini";
const pricedModel = ["gpt-4.1-mini", "gpt-4.1-mini-2025-04-14"].includes(model);

function emit(record) {
  console.log(JSON.stringify(record));
}

if (process.argv.includes("--plan")) {
  emit({ model, cases: liveCases, completionLimit: 1050, maximumCompletionCalls: liveCases.length });
} else if (!process.argv.includes("--live") || !process.env.OPENAI_API_KEY) {
  console.error("Use --plan for the six cases. Use --live in an approved server environment with a project API key.");
  process.exitCode = 1;
} else {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  emit({ type: "run", model, startedAt: new Date().toISOString(), expectedCases: liveCases.length });
  for (const item of liveCases) {
    const start = performance.now();
    let completion;
    const recordingClient = {
      moderations: client.moderations,
      chat: { completions: { create: async (...args) => {
        completion = await client.chat.completions.create(...args);
        return completion;
      } } },
    };

    let result;
    let error;
    try {
      result = await generateReading({ client: recordingClient, input: item.account, mode: item.mode, model });
      if (!result.reading) error = { status: result.status, message: result.error };
    } catch (failure) {
      error = { name: failure.name, status: failure.status ?? null };
    }

    const usage = completion?.usage ?? null;
    const estimatedCostUsd = usage && pricedModel
      ? (usage.prompt_tokens * 0.40 + usage.completion_tokens * 1.60) / 1_000_000
      : null;
    const reading = result?.reading ?? null;
    const initialReadingCard = reading ? {
      title: reading.title,
      metaphor: reading.metaphor,
      sections: [{ label: layers[readingPreviewLayer], text: reading[readingPreviewLayer] }],
    } : null;
    emit({
      type: "case", ...item, seconds: (performance.now() - start) / 1000,
      returnedModel: completion?.model ?? null, usage, estimatedCostUsd,
      uneditedCompletion: completion?.choices?.[0]?.message?.content ?? null,
      refusal: completion?.choices?.[0]?.message?.refusal ?? null,
      finishReason: completion?.choices?.[0]?.finish_reason ?? null,
      reading, initialReadingCard, error: error ?? null,
    });
    if (error) process.exitCode = 1;
  }
}
