import { experiences, layers } from "./content.js";

const KEY = "eidomancer-echo-journal-v1";
const evidenceKinds = new Set(["conduct", "declaration", "priority", "exception"]);
export const journalLimit = 30;
export const journalNoteLimit = 1500;

function validEntry(entry) {
  const reading = entry?.reading;
  return typeof entry?.id === "string" && entry.id.length > 0 &&
    typeof entry.savedAt === "string" && Number.isFinite(Date.parse(entry.savedAt)) &&
    typeof entry.question === "string" && Object.hasOwn(experiences, entry.mode) &&
    ["title", ...Object.keys(layers)].every((key) => typeof reading?.[key] === "string") &&
    ["metaphor", "alternative"].every((key) => reading[key] === undefined || typeof reading[key] === "string") &&
    (reading.evidence === undefined || (Array.isArray(reading.evidence) && reading.evidence.every(
      (item) => typeof item?.quote === "string" && evidenceKinds.has(item.kind),
    ))) && typeof entry.note === "string";
}

export function loadJournal(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) return [];
    const ids = new Set();
    return value.filter((entry) => {
      if (!validEntry(entry) || ids.has(entry.id)) return false;
      ids.add(entry.id);
      return true;
    }).slice(0, journalLimit);
  } catch {
    return [];
  }
}

export function saveJournal(storage, entries) {
  if (entries.length > journalLimit) return false;
  try {
    if (entries.length === 0) storage.removeItem(KEY);
    else storage.setItem(KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function newJournalEntry({ id, savedAt, reading, question, mode }) {
  return { id, savedAt, reading, question, mode, note: "" };
}
