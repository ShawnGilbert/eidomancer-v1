#!/usr/bin/env node
import fs from "node:fs/promises";
import { processAgentRequest } from "../src/lib/agentProtocol.js";
import { processAgentRequestV02 } from "../src/lib/agentProtocolV02.js";

async function readInput() {
  const file = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
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
  const useV02 = process.argv.includes("--v0.2") ||
    raw?.protocol_version === "eidomancer.agent.v0.2";
  const result = useV02
    ? await processAgentRequestV02(raw)
    : await processAgentRequest(raw);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    ok: false,
    error: { code: "INVALID_JSON", message: error.message },
  }, null, 2)}\n`);
  process.exitCode = 2;
}
