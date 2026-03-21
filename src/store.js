const CARD_PREFIX = "eidomancer_card_";
const NOTE_PREFIX = "eidomancer_note_";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function saveCardForDay(dayKey, card) {
  localStorage.setItem(CARD_PREFIX + dayKey, JSON.stringify(card));
}

export function getCardForDay(dayKey) {
  return safeParse(localStorage.getItem(CARD_PREFIX + dayKey), null);
}

export function saveNote(dayKey, note) {
  localStorage.setItem(NOTE_PREFIX + dayKey, note || "");
}

export function getNote(dayKey) {
  return localStorage.getItem(NOTE_PREFIX + dayKey) || "";
}

export function listDays() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(CARD_PREFIX))
    .map((key) => key.replace(CARD_PREFIX, ""))
    .sort((a, b) => b.localeCompare(a));
}

export function getStreak(todayKey) {
  const days = listDays();
  if (!days.length) return 0;

  const available = new Set(days);
  let streak = 0;
  let cursor = new Date(todayKey);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);

    if (!available.has(key)) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}