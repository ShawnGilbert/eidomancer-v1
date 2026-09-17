#!/usr/bin/env node
import fs from "node:fs/promises";
import { processAgentRequest } from "../src/lib/agentProtocol.js";

async function readInput() {
  const file = process.argv[2];
  return file ? fs.readFile(file, "utf8") : new Promise((resolve, reject) => {
    let body = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { body += chunk; });
    process.stdin.on("end", () => resolve(body));
    process.stdin.on("error", reject);
  });
}

try {
  const raw = JSON.parse(await readInput());
  const result = await processAgentRequest(raw);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    ok: false,
    error: { code: "INVALID_JSON", message: error.message },
  }, null, 2)}\n`);
  process.exitCode = 2;
}
