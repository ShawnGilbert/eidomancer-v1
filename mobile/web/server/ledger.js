import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID } from "node:crypto";
import { closeSync, openSync, statSync } from "node:fs";
import { isAbsolute } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";
import { offer } from "../terms.js";

export const day = 86_400_000;
export const replayWindow = day;
const sessionWindow = 7 * day;
const credential = /^[A-Za-z0-9_-]{43}$/;
const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const token = () => randomBytes(32).toString("base64url");

export class PilotError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const failure = (status, code, message) => { throw new PilotError(status, code, message); };

const schema = `
  CREATE TABLE pilot_meta (id INTEGER PRIMARY KEY CHECK(id=1), key_check TEXT NOT NULL,
    recovering INTEGER NOT NULL DEFAULT 0 CHECK(recovering IN (0,1))) STRICT;
  CREATE TABLE pilot_orders (
    id TEXT PRIMARY KEY, checkout TEXT NOT NULL UNIQUE, payment TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE, code TEXT UNIQUE,
    used INTEGER NOT NULL DEFAULT 0 CHECK(used BETWEEN 0 AND ${offer.readings}),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked','review')),
    created INTEGER NOT NULL
  ) STRICT;
  CREATE TABLE pilot_sessions (
    order_id TEXT PRIMARY KEY REFERENCES pilot_orders(id), digest TEXT NOT NULL UNIQUE, expires INTEGER NOT NULL
  ) STRICT;
  CREATE TABLE pilot_requests (
    order_id TEXT NOT NULL REFERENCES pilot_orders(id), id TEXT NOT NULL, attempt TEXT NOT NULL,
    digest TEXT NOT NULL, started INTEGER NOT NULL, completed INTEGER, response BLOB,
    credited INTEGER NOT NULL DEFAULT 0 CHECK(credited IN (0,1)),
    PRIMARY KEY(order_id, id)
  ) STRICT;
  CREATE UNIQUE INDEX pilot_one_pending ON pilot_requests(order_id) WHERE completed IS NULL;
  CREATE TABLE pilot_events (
    id INTEGER PRIMARY KEY, order_id TEXT NOT NULL REFERENCES pilot_orders(id),
    action TEXT NOT NULL, at INTEGER NOT NULL, remaining INTEGER NOT NULL
  ) STRICT;
`;

function privateFile(path) { closeSync(openSync(path, "wx", 0o600)); }

export function openLedger({ database, key, clock = Date.now, initialize = false }) {
  if (!isAbsolute(database) || !Buffer.isBuffer(key) || key.length !== 32) throw new Error("Set an absolute database path and a 32-byte pilot key.");
  if (initialize) privateFile(database);
  if (!statSync(database, { throwIfNoEntry: false })?.isFile()) throw new Error("Pilot ledger missing. Initialize a new pilot explicitly or recover the existing ledger.");
  const db = new DatabaseSync(database);
  const digest = (purpose, value) => createHmac("sha256", key).update(purpose + "\0").update(value).digest("hex");
  const cipherKey = Buffer.from(digest("response-key", "v1"), "hex");
  const get = (sql, ...values) => db.prepare(sql).get(...values);
  const run = (sql, ...values) => db.prepare(sql).run(...values);
  function transaction(work) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  try {
    db.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON;");
    if (initialize) transaction(() => {
      db.exec(schema);
      run("INSERT INTO pilot_meta (id,key_check) VALUES (1,?)", digest("ledger", "v1"));
      // Seed the existing guard's tables in the same transaction so restore can verify them.
      db.exec(`CREATE TABLE mobile_monthly_spend (month TEXT PRIMARY KEY,
        reserved_nanos INTEGER NOT NULL CHECK(reserved_nanos >= 0)) STRICT;
        CREATE TABLE mobile_spend_halt (id INTEGER PRIMARY KEY CHECK(id=1)) STRICT;`);
    });
    if (get("SELECT key_check FROM pilot_meta WHERE id=1")?.key_check !== digest("ledger", "v1")) {
      throw new Error("Pilot key does not match the ledger.");
    }
    get("SELECT month,reserved_nanos FROM mobile_monthly_spend LIMIT 1");
    get("SELECT id FROM mobile_spend_halt LIMIT 1");
  } catch (error) { db.close(); throw error; }

  const audit = (id, action, used) => run("INSERT INTO pilot_events (order_id,action,at,remaining) VALUES (?,?,?,?)",
    id, action, clock(), offer.readings - used);
  const recovering = () => get("SELECT recovering FROM pilot_meta WHERE id=1").recovering === 1;
  function ready() {
    if (recovering()) failure(503, "RECOVERY", "Reading access is paused for maintenance. Contact support if you need help.");
  }
  function session(raw) {
    if (typeof raw !== "string" || !credential.test(raw)) return undefined;
    return get(`SELECT o.id,o.used FROM pilot_sessions s JOIN pilot_orders o ON o.id=s.order_id
      WHERE s.digest=? AND s.expires>? AND o.status='active'`, digest("session", raw), clock());
  }
  function requireSession(raw) {
    const access = session(raw);
    if (!access) failure(401, "ACCESS", "Enter your access code to continue.");
    return access;
  }
  const order = (id) => {
    if (typeof id !== "string" || !id) failure(400, "ORDER", "Specify an order ID.");
    const row = get("SELECT * FROM pilot_orders WHERE id=?", id);
    if (!row) failure(404, "ORDER", "Order not found.");
    return row;
  };
  const emailDigest = (email) => {
    if (typeof email !== "string" || email.length > 254 || !emailFormat.test(email.trim())) failure(400, "EMAIL", "Enter the verified checkout email.");
    return digest("checkout-email", email.trim().toLowerCase());
  };
  const clearAccess = (id) => {
    run("DELETE FROM pilot_sessions WHERE order_id=?", id);
    run("UPDATE pilot_requests SET response=NULL WHERE order_id=? AND response IS NOT NULL", id);
  };
  const purge = () => run("UPDATE pilot_requests SET response=NULL WHERE response IS NOT NULL AND completed<=?", clock() - replayWindow);
  function seal(value, row) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", cipherKey, nonce);
    cipher.setAAD(Buffer.from(row));
    const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
    return Buffer.concat([nonce, cipher.getAuthTag(), data]);
  }
  function unseal(value, row) {
    const decipher = createDecipheriv("aes-256-gcm", cipherKey, value.subarray(0, 12));
    decipher.setAAD(Buffer.from(row));
    decipher.setAuthTag(value.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]));
  }

  return {
    recovering,
    grant({ checkout, payment, email, amount, currency, paid }) {
      if (typeof checkout !== "string" || typeof payment !== "string" ||
          !/^cs_live_[A-Za-z0-9]+$/.test(checkout) || !/^pi_[A-Za-z0-9]+$/.test(payment) ||
          checkout.length > 200 || payment.length > 200 || paid !== true || amount !== offer.cents || currency !== offer.currency) {
        failure(400, "PAYMENT", "Confirm a paid live Stripe Checkout Session and Payment Intent for $4.99 USD.");
      }
      const buyer = emailDigest(email);
      return transaction(() => {
        ready();
        if (get("SELECT id FROM pilot_orders WHERE checkout=? OR payment=? OR email=?", checkout, payment, buyer)) {
          failure(409, "DUPLICATE", "Purchase or buyer already recorded. Use recovery for an existing purchase.");
        }
        if (get("SELECT count(*) AS n FROM pilot_orders").n >= offer.buyers) failure(409, "COHORT", "The ten-buyer pilot is full.");
        const id = randomUUID();
        const code = token();
        run("INSERT INTO pilot_orders (id,checkout,payment,email,code,created) VALUES (?,?,?,?,?,?)",
          id, checkout, payment, buyer, digest("code", code), clock());
        audit(id, "grant", 0);
        return { id, code };
      });
    },
    rotate(id, email) {
      const buyer = emailDigest(email);
      return transaction(() => {
        ready();
        const row = order(id);
        if (row.status !== "active" || row.email !== buyer) failure(403, "RECOVER", "Order must be active and match the verified checkout email.");
        const code = token();
        clearAccess(id);
        run("UPDATE pilot_orders SET code=? WHERE id=?", digest("code", code), id);
        audit(id, "rotate", row.used);
        return { id, code };
      });
    },
    revoke(id) {
      return transaction(() => {
        const row = order(id);
        if (row.status === "revoked") return;
        clearAccess(id);
        run("UPDATE pilot_orders SET status='revoked',code=NULL WHERE id=?", id);
        audit(id, "revoke", row.used);
      });
    },
    exchange(code) {
      if (typeof code !== "string" || !credential.test(code)) failure(401, "ACCESS", "That access code is invalid or inactive.");
      return transaction(() => {
        ready();
        const row = get("SELECT id,used FROM pilot_orders WHERE code=? AND status='active'", digest("code", code));
        if (!row) failure(401, "ACCESS", "That access code is invalid or inactive.");
        const raw = token();
        run(`INSERT INTO pilot_sessions VALUES (?,?,?) ON CONFLICT(order_id)
          DO UPDATE SET digest=excluded.digest,expires=excluded.expires`, row.id, digest("session", raw), clock() + sessionWindow);
        return { raw, maxAge: sessionWindow, remaining: offer.readings - row.used };
      });
    },
    logout(raw) {
      if (typeof raw === "string" && credential.test(raw)) run("DELETE FROM pilot_sessions WHERE digest=?", digest("session", raw));
    },
    balance(raw) {
      ready();
      const row = session(raw);
      return row ? { remaining: offer.readings - row.used } : { remaining: null };
    },
    begin(raw, { id, mode, input }) {
      const requestDigest = digest("request", JSON.stringify([mode, input]));
      return transaction(() => {
        ready();
        const access = requireSession(raw);
        const row = get("SELECT * FROM pilot_requests WHERE order_id=? AND id=?", access.id, id);
        if (row) {
          if (row.digest !== requestDigest) failure(409, "MISMATCH", "This retry belongs to a different question.");
          if (row.completed === null) failure(409, "PENDING", "This reading is still pending. Retry the same question shortly. Contact support if it remains pending.");
          if (row.response === null || row.completed <= clock() - replayWindow) failure(410, "EXPIRED", "This completed reading is outside its retrieval window. Contact support if you didn’t receive it.");
          return { reading: unseal(row.response, `${access.id}:${id}`), remaining: offer.readings - access.used };
        }
        if (access.used >= offer.readings) failure(409, "EXHAUSTED", "You’ve used all five readings.");
        if (get("SELECT id FROM pilot_requests WHERE order_id=? AND completed IS NULL", access.id)) {
          failure(409, "PENDING", "Another reading is still pending. Retry shortly.");
        }
        const attempt = randomUUID();
        run("INSERT INTO pilot_requests (order_id,id,attempt,digest,started) VALUES (?,?,?,?,?)", access.id, id, attempt, requestDigest, clock());
        return { orderId: access.id, id, attempt };
      });
    },
    finish({ orderId, id, attempt }, raw, reading) {
      return transaction(() => {
        const row = get("SELECT attempt,completed FROM pilot_requests WHERE order_id=? AND id=?", orderId, id);
        if (row?.attempt !== attempt || row.completed !== null) return null;
        const access = reading && !recovering() && session(raw);
        if (!access || access.id !== orderId) {
          run("DELETE FROM pilot_requests WHERE order_id=? AND id=?", orderId, id);
          return null;
        }
        run("UPDATE pilot_requests SET completed=?,response=? WHERE order_id=? AND id=?",
          clock(), seal(reading, `${orderId}:${id}`), orderId, id);
        run("UPDATE pilot_orders SET used=used+1 WHERE id=?", orderId);
        audit(orderId, "reading", access.used + 1);
        return { reading, remaining: offer.readings - access.used - 1 };
      });
    },
    clearPending(id) {
      return transaction(() => {
        const row = order(id);
        const result = run("DELETE FROM pilot_requests WHERE order_id=? AND completed IS NULL AND started<=?", id, clock() - 120_000);
        if (!result.changes) failure(409, "PENDING", "No pending reading older than two minutes.");
        audit(id, "clear-pending", row.used);
      });
    },
    recredit(id, requestId) {
      return transaction(() => {
        ready();
        const row = order(id);
        if (row.status !== "active" || row.used <= 0 || typeof requestId !== "string") {
          failure(409, "RECREDIT", "An active order and a completed request are required.");
        }
        const result = run(`UPDATE pilot_requests SET credited=1,response=NULL WHERE order_id=? AND id=?
          AND completed IS NOT NULL AND credited=0`, id, requestId);
        if (!result.changes) failure(409, "RECREDIT", "This request is missing, incomplete, or already recredited.");
        run("UPDATE pilot_orders SET used=used-1 WHERE id=?", id);
        audit(id, "recredit", row.used - 1);
      });
    },
    requests(id) {
      order(id);
      return db.prepare("SELECT id,started,completed,credited FROM pilot_requests WHERE order_id=? ORDER BY started").all(id);
    },
    list() {
      return db.prepare("SELECT id,checkout,payment,used,status FROM pilot_orders ORDER BY created").all();
    },
    purge,
    async backupTo(destination) {
      purge();
      if (!isAbsolute(destination)) throw new Error("Use an absolute backup path.");
      privateFile(destination);
      await backup(db, destination);
    },
    quarantineRestore() {
      transaction(() => {
        if (get("PRAGMA integrity_check").integrity_check !== "ok") throw new Error("Backup integrity check failed.");
        db.exec(`UPDATE pilot_meta SET recovering=1 WHERE id=1;
          DELETE FROM pilot_sessions;
          DELETE FROM pilot_requests WHERE completed IS NULL;
          UPDATE pilot_requests SET response=NULL WHERE response IS NOT NULL;
          UPDATE pilot_orders SET status='review',code=NULL,used=${offer.readings} WHERE status!='revoked';`);
        // A snapshot can lag provider spend. Reserve the full supported web cap in the restore month.
        run(`INSERT INTO mobile_monthly_spend VALUES (?,5000000000) ON CONFLICT(month)
          DO UPDATE SET reserved_nanos=max(reserved_nanos,excluded.reserved_nanos)`, new Date(clock()).toISOString().slice(0, 7));
      });
    },
    reconcile(id, remaining) {
      if (!Number.isInteger(remaining) || remaining < 0 || remaining > offer.readings) failure(400, "BALANCE", "Specify a verified remaining balance between zero and five.");
      return transaction(() => {
        const row = order(id);
        if (!recovering() || row.status !== "review") failure(409, "REVIEW", "Only quarantined orders can be reconciled.");
        const used = offer.readings - remaining;
        run("UPDATE pilot_orders SET status='active',used=? WHERE id=?", used, id);
        audit(id, "reconcile", used);
      });
    },
    resume() {
      transaction(() => {
        if (!recovering() || get("SELECT id FROM pilot_orders WHERE status='review' LIMIT 1")) failure(409, "REVIEW", "Resolve all quarantined orders before resuming.");
        run("UPDATE pilot_meta SET recovering=0 WHERE id=1");
      });
    },
    close() { db.close(); },
  };
}
