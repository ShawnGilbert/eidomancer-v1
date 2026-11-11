import test from "node:test";
import assert from "node:assert/strict";
import { loadJournal, saveJournal, newJournalEntry, journalLimit } from "../src/journal.js";

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
test("Echo Journal is empty by default and fails safely on corrupt data", () => {
  const s = storage();
  assert.deepEqual(loadJournal(s), []);
  s.setItem("eidomancer-echo-journal-v1", "{broken");
  assert.deepEqual(loadJournal(s), []);
});
test("Echo Journal stores explicit entries and notes without modifying the reading", () => {
  const s = storage();
  const reading = { title: "A Crack", insight: "Cracks are information." };
  const entry = newJournalEntry({ id: "a", savedAt: "2026-11-11T00:00:00Z", reading, question: "What changed?", mode: "ask" });
  assert.equal(entry.note, "");
  assert.equal(saveJournal(s, [entry]), true);
  assert.deepEqual(loadJournal(s), [entry]);
  assert.deepEqual(reading, { title: "A Crack", insight: "Cracks are information." });
  assert.equal(saveJournal(s, [{ ...entry, note: "The exception mattered." }]), true);
  assert.equal(loadJournal(s)[0].note, "The exception mattered.");
  assert.equal(saveJournal(s, []), true);
  assert.deepEqual(loadJournal(s), []);
});
test("Echo Journal bounds local entries and reports storage failures", () => {
  const s = storage();
  const entries = Array.from({ length: journalLimit + 5 }, (_, i) => ({
    id: String(i), reading: { insight: "Signal" },
  }));
  assert.equal(saveJournal(s, entries), true);
  assert.equal(loadJournal(s).length, journalLimit);
  assert.equal(saveJournal({ setItem() { throw new Error("quota"); } }, entries), false);
});
