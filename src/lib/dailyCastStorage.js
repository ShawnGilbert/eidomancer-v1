// D:\eidomancer\src\lib\dailyCastStorage.js

const STORAGE_KEY = "eidomancer_daily_casts_v1";
const MAX_STORED_CASTS = 30;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isValidCast(candidate) {
  return (
    candidate &&
    typeof candidate === "object" &&
    typeof candidate.dateKey === "string" &&
    candidate.dateKey.trim().length > 0
  );
}

function normalizeCast(cast) {
  if (!isValidCast(cast)) return null;

  return {
    ...cast,
    dateKey: String(cast.dateKey).trim(),
    createdAt:
      typeof cast.createdAt === "string" && cast.createdAt.trim()
        ? cast.createdAt
        : new Date().toISOString(),
  };
}

function sortNewestFirst(casts = []) {
  return [...casts].sort((a, b) => {
    const aDate = Date.parse(a?.createdAt || "") || 0;
    const bDate = Date.parse(b?.createdAt || "") || 0;

    if (bDate !== aDate) return bDate - aDate;

    return String(b?.dateKey || "").localeCompare(String(a?.dateKey || ""));
  });
}

function dedupeByDateKey(casts = []) {
  const map = new Map();

  for (const cast of casts) {
    const normalized = normalizeCast(cast);
    if (!normalized) continue;

    const existing = map.get(normalized.dateKey);
    if (!existing) {
      map.set(normalized.dateKey, normalized);
      continue;
    }

    const existingTime = Date.parse(existing.createdAt || "") || 0;
    const nextTime = Date.parse(normalized.createdAt || "") || 0;

    if (nextTime >= existingTime) {
      map.set(normalized.dateKey, normalized);
    }
  }

  return Array.from(map.values());
}

function readStorage() {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];

  return sortNewestFirst(dedupeByDateKey(parsed)).slice(0, MAX_STORED_CASTS);
}

function writeStorage(casts = []) {
  if (!isBrowser()) return [];

  const cleaned = sortNewestFirst(dedupeByDateKey(casts)).slice(0, MAX_STORED_CASTS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  return cleaned;
}

export function getStoredDailyCasts() {
  return readStorage();
}

export function saveDailyCast(cast) {
  const normalized = normalizeCast(cast);
  if (!normalized) {
    throw new Error("saveDailyCast requires a cast object with a valid dateKey.");
  }

  const existing = readStorage().filter((item) => item.dateKey !== normalized.dateKey);
  return writeStorage([normalized, ...existing]);
}

export function getTodayDailyCast(dateKey) {
  if (!dateKey || typeof dateKey !== "string") return null;

  const casts = readStorage();
  return casts.find((cast) => cast.dateKey === dateKey) || null;
}

export function getRecentDailyCasts(limit = 7) {
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 7;

  return readStorage().slice(0, safeLimit);
}

export function removeDailyCast(dateKey) {
  if (!dateKey || typeof dateKey !== "string") return getStoredDailyCasts();

  const filtered = readStorage().filter((cast) => cast.dateKey !== dateKey);
  return writeStorage(filtered);
}

export function clearDailyCasts() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasDailyCastForDate(dateKey) {
  return Boolean(getTodayDailyCast(dateKey));
}

export function getDailyCastCount() {
  return readStorage().length;
}