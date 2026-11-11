const KEY = "eidomancer-echo-journal-v1";
export const journalLimit = 30;

export function loadJournal(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter((entry) => entry && typeof entry.id === "string" && entry.reading && typeof entry.reading.insight === "string").slice(0, journalLimit) : [];
  } catch { return []; }
}

export function saveJournal(storage, entries) {
  try {
    storage.setItem(KEY, JSON.stringify(entries.slice(0, journalLimit)));
    return true;
  } catch { return false; }
}

export function newJournalEntry({ id, savedAt, reading, question, mode }) {
  return { id, savedAt, reading, question, mode, note: "" };
}
