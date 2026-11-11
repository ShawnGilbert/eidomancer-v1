import "dotenv/config";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { generateReading } from "../server/reading.js";
import { cases } from "./cases.js";

if (!process.argv.includes("--live") || !process.env.OPENAI_API_KEY) {
  throw new Error("Use --live with an approved project API key. This run makes six billable model requests.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
const model = process.env.MOBILE_MODEL || "gpt-4.1-mini";
let inputTokens = 0;
let outputTokens = 0;
let failures = 0;
for (const item of cases) {
  const start = performance.now();
  try {
    const { reading, usage, error } = await generateReading({ client, input: item.account, mode: item.mode, model });
    inputTokens += usage?.prompt_tokens ?? 0;
    outputTokens += usage?.completion_tokens ?? 0;
    if (!reading) throw new Error(error);
    console.log(JSON.stringify({ id: item.id, seconds: (performance.now() - start) / 1000, rubric: item.rubric, reading }, null, 2));
  } catch (error) {
    failures++;
    console.error(item.id, error.name, error.status ?? "", error.message);
  }
}
console.log({ model, inputTokens, outputTokens, failures });
if (failures) process.exitCode = 1;
