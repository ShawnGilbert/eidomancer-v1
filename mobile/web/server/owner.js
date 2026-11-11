import { linkSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { openLedger } from "./ledger.js";

const [command, id, value] = process.argv.slice(2);
const { WEB_PILOT_DATABASE: database, WEB_PILOT_KEY: hex } = process.env;
if (!database || !isAbsolute(database) || !/^[a-f0-9]{64}$/i.test(hex || "")) throw new Error("Set WEB_PILOT_DATABASE and WEB_PILOT_KEY on the owner host.");
const key = Buffer.from(hex, "hex");
const options = { database, key };
const input = () => JSON.parse(readFileSync(0, "utf8"));
let ledger;
try {
  if (command === "restore") {
    // Run on a stopped service. The target must be a new file; never overwrite the old database.
    if (!id) throw new Error("Specify the trusted backup path.");
    const stage = mkdtempSync(join(dirname(database), ".pilot-restore-"));
    const stagedDatabase = join(stage, "ledger.sqlite");
    try {
      const snapshot = openLedger({ database: resolve(id), key });
      try { await snapshot.backupTo(stagedDatabase); } finally { snapshot.close(); }
      const restored = openLedger({ database: stagedDatabase, key });
      try { restored.quarantineRestore(); } finally { restored.close(); }
      // Publish the quarantined file atomically. The existing target is never overwritten.
      linkSync(stagedDatabase, database);
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  } else {
    const commands = new Set(["init", "grant", "rotate", "revoke", "list", "requests", "recredit", "clear-pending", "backup", "reconcile", "resume"]);
    if (!commands.has(command)) throw new Error("Use init, grant, rotate, revoke, list, requests, recredit, clear-pending, backup, restore, reconcile, or resume.");
    ledger = openLedger({ ...options, initialize: command === "init" });
    switch (command) {
      case "grant": console.log(JSON.stringify(ledger.grant(input()))); break;
      case "rotate": console.log(JSON.stringify(ledger.rotate(id, input().email))); break;
      case "revoke": ledger.revoke(id); break;
      case "list": console.table(ledger.list()); break;
      case "requests": console.table(ledger.requests(id)); break;
      case "recredit": ledger.recredit(id, value); break;
      case "clear-pending": ledger.clearPending(id); break;
      case "backup":
        if (!id) throw new Error("Specify the backup destination.");
        await ledger.backupTo(resolve(id));
        break;
      case "reconcile": ledger.reconcile(id, Number(value)); break;
      case "resume": ledger.resume(); break;
    }
  }
} catch (error) {
  console.error(error instanceof SyntaxError ? "Invalid owner command JSON." : error.message);
  process.exitCode = 1;
} finally {
  ledger?.close();
}
