import test from "node:test";
import assert from "node:assert/strict";
import { layers } from "../src/content.js";
import { loadJournal, saveJournal, newJournalEntry, journalLimit } from "../src/journal.js";

const key = "eidomancer-echo-journal-v1";

function storage() {
  const data = new Map();
  return {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => data.set(name, value),
    removeItem: (name) => data.delete(name),
  };
}

function savedReading(id = "a") {
  const reading = {
    title: "A Crack",
    ...Object.fromEntries(Object.keys(layers).map((name) => [name, `Original ${name}`])),
    metaphor: "A split in the seam.",
    alternative: "A second observation could change the interpretation.",
    evidence: [{ kind: "conduct", quote: "What changed?" }],
  };
  return newJournalEntry({ id, savedAt: "2026-11-11T00:00:00Z", reading, question: "What changed?", mode: "ask" });
}

test("Echo Journal is empty by default and fails safely on corrupt data", () => {
  const s = storage();
  assert.deepEqual(loadJournal(s), []);
  s.setItem(key, "{broken");
  assert.deepEqual(loadJournal(s), []);
  const entry = savedReading();
  s.setItem(key, JSON.stringify([
    { ...entry, savedAt: "yesterday" },
    { ...entry, reading: { ...entry.reading, evidence: [{ quote: {}, kind: "conduct" }] } },
    entry, entry,
  ]));
  assert.deepEqual(loadJournal(s), [entry]);
});

test("Echo Journal retains all seven layers and saves observations separately", () => {
  const s = storage();
  const entry = savedReading();
  assert.equal(entry.note, "");
  assert.equal(s.getItem(key), null);
  assert.equal(saveJournal(s, [entry]), true);
  assert.deepEqual(loadJournal(s), [entry]);
  assert.equal(saveJournal(s, [{ ...entry, note: "The exception mattered." }]), true);
  const [reopened] = loadJournal(s);
  assert.equal(reopened.note, "The exception mattered.");
  assert.deepEqual(reopened.reading, entry.reading);
  assert.equal(reopened.question, entry.question);
});

test("deleting one entry retains the others and clear removes the storage key", () => {
  const s = storage();
  const first = savedReading();
  const second = savedReading("b");
  saveJournal(s, [first, second]);
  assert.equal(saveJournal(s, loadJournal(s).filter(({ id }) => id !== first.id)), true);
  assert.deepEqual(loadJournal(s), [second]);
  assert.equal(saveJournal(s, []), true);
  assert.equal(s.getItem(key), null);
  assert.deepEqual(loadJournal(s), []);
});

test("Echo Journal rejects overflow without evicting old entries", () => {
  const s = storage();
  const entries = Array.from({ length: journalLimit }, (_, i) => savedReading(String(i)));
  assert.equal(saveJournal(s, entries), true);
  assert.equal(saveJournal(s, [savedReading(), ...entries]), false);
  assert.deepEqual(loadJournal(s), entries);
  assert.equal(saveJournal({ setItem() { throw new Error("quota"); } }, entries), false);
  assert.equal(saveJournal({ removeItem() { throw new Error("storage"); } }, []), false);
});
