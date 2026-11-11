import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const day = 86400000;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const validInstall = (value) => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);

export function createEntitlements({ database, key, verifyPlay, verifyApple, limits, clock = Date.now }) {
  const db = new DatabaseSync(database);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY, nonce INTEGER UNIQUE, platform TEXT, install TEXT, created INTEGER
    );
    CREATE TABLE IF NOT EXISTS installs (
      id TEXT PRIMARY KEY, owner TEXT, token TEXT UNIQUE, expires INTEGER, checked INTEGER,
      keyId TEXT UNIQUE, publicKey TEXT, signCount INTEGER
    );
    CREATE INDEX IF NOT EXISTS installs_owner ON installs(owner);
    CREATE TABLE IF NOT EXISTS usage (
      scope TEXT, period INTEGER, used INTEGER NOT NULL, PRIMARY KEY (scope, period)
    );
  `);
  const statement = (sql) => db.prepare(sql);
  const queries = {
    prune: statement("DELETE FROM challenges WHERE created <= ?"),
    pending: statement("SELECT COUNT(*) AS count FROM challenges"),
    create: statement("INSERT OR IGNORE INTO challenges VALUES (?, ?, ?, ?, ?)"),
    take: statement("DELETE FROM challenges WHERE id = ? RETURNING *"),
    install: statement("SELECT * FROM installs WHERE id = ?"),
    slots: statement("SELECT id FROM installs WHERE owner = ? AND expires > ? AND id <> ? ORDER BY checked DESC, id"),
    evict: statement("UPDATE installs SET expires = 0 WHERE id = ?"),
    save: statement(`INSERT INTO installs VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET token=excluded.token, expires=excluded.expires, checked=excluded.checked, signCount=excluded.signCount`),
    session: statement("SELECT id, owner FROM installs WHERE token = ? AND expires > ?"),
    usage: statement("SELECT used FROM usage WHERE scope = ? AND period = ?"),
    add: statement("INSERT INTO usage VALUES (?, ?, 1) ON CONFLICT(scope, period) DO UPDATE SET used=used+1"),
    pruneUsage: statement("DELETE FROM usage WHERE period > 0 AND period < ?"),
    totals: statement("SELECT COALESCE(SUM(used), 0) AS count FROM usage WHERE scope = 'global' AND period = ?"),
    refund: statement("UPDATE usage SET used = used - 1 WHERE scope = ? AND period = 0 AND used > 0"),
  };

  function transaction(operation) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  return {
    challenge({ platform, install }) {
      if (!validInstall(install) || (platform !== "android" && platform !== "ios")) return null;
      const now = clock();
      return transaction(() => {
        queries.prune.run(now - 120000);
        if (queries.pending.get().count >= 1000) return null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const id = randomBytes(24).toString("base64url");
          const nonce = randomInt(1, 2147483647);
          if (queries.create.run(id, nonce, platform, install, now).changes) return { id, nonce, registered: Boolean(queries.install.get(`${platform}:${install}`)) };
        }
        return null;
      });
    },

    async redeem({ id, proof }) {
      if (typeof id !== "string" || id.length !== 32 || !proof || typeof proof !== "object") return null;
      const challenge = queries.take.get(id);
      const now = clock();
      if (!challenge || challenge.created <= now - 120000) return null;
      const install = `${challenge.platform}:${challenge.install}`;
      const previous = queries.install.get(install);
      const verified = challenge.platform === "ios"
        ? await verifyApple(proof, challenge, previous)
        : await verifyPlay(proof, challenge, now);
      if (!verified?.owner) return null;

      const owner = createHmac("sha256", key).update(`${challenge.platform}:${verified.owner}`).digest("hex");
      const token = randomBytes(32).toString("base64url");
      return transaction(() => {
        if (clock() - challenge.created >= 120000) return null;
        const current = queries.install.get(install);
        if (current && (current.owner !== owner || current.keyId !== (verified.keyId ?? null) ||
            (current.keyId && verified.signCount <= current.signCount))) return null;
        const expires = Math.min(verified.expires ?? now + day, now + day);
        if (expires <= now) return null;
        for (const slot of queries.slots.all(owner, now, install).slice(limits.devices - 1)) queries.evict.run(slot.id);
        queries.save.run(install, owner, digest(token), expires, now, verified.keyId ?? null,
          verified.publicKey ?? null, verified.signCount ?? null);
        return { token, expires };
      });
    },

    reserve(authorization) {
      if (typeof authorization !== "string" || !/^Bearer [\w-]{43}$/.test(authorization)) return "unlicensed";
      const now = clock();
      const period = Math.floor(now / day);
      return transaction(() => {
        const session = queries.session.get(digest(authorization.slice(7)), now);
        if (!session) return "unlicensed";
        const counters = [
          [`install:${session.id}`, period, limits.installDaily],
          [`owner:${session.owner}`, period, limits.ownerDaily],
          [`owner:${session.owner}`, 0, limits.ownerLifetime],
          ["global", period, limits.globalDaily],
        ];
        if (counters.some(([scope, time, maximum]) => (queries.usage.get(scope, time)?.used ?? 0) >= maximum)) {
          return "limited";
        }
        if (queries.totals.get(period).count === 0) queries.pruneUsage.run(period - 7);
        for (const [scope, time] of counters) queries.add.run(scope, time);
        let refunded = false;
        return {
          refund() {
            if (refunded) return;
            queries.refund.run(`owner:${session.owner}`);
            refunded = true;
          },
        };
      });
    },

    close() { db.close(); },
  };
}
