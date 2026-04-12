// D:\eidomancer\src\lib\dailyFocusStorage.js

const STORAGE_KEY = "eidomancer_daily_focus_v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readStore() {
  if (!isBrowser()) return {};

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  const parsed = safeParse(raw, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeStore(store = {}) {
  if (!isBrowser()) return {};
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

function normalizeFocus(value = "") {
  return String(value || "").trim();
}

export function getDailyFocus(dateKey = getDateKey()) {
  if (!dateKey) return "";

  const store = readStore();
  const entry = store[dateKey];

  if (!entry || typeof entry !== "object") return "";
  return normalizeFocus(entry.focus);
}

export function saveDailyFocus(focus, dateKey = getDateKey()) {
  const normalizedFocus = normalizeFocus(focus);
  const store = readStore();

  store[dateKey] = {
    focus: normalizedFocus,
    updatedAt: new Date().toISOString(),
  };

  writeStore(store);
  return normalizedFocus;
}

export function clearDailyFocus(dateKey = getDateKey()) {
  const store = readStore();

  if (store[dateKey]) {
    delete store[dateKey];
    writeStore(store);
  }
}

export function getAllDailyFocusEntries() {
  return readStore();
}

export function pruneDailyFocusEntries(maxEntries = 30) {
  const store = readStore();
  const entries = Object.entries(store).sort((a, b) => {
    const aTime = Date.parse(a[1]?.updatedAt || "") || 0;
    const bTime = Date.parse(b[1]?.updatedAt || "") || 0;
    return bTime - aTime;
  });

  const trimmed = entries.slice(0, maxEntries);
  const nextStore = Object.fromEntries(trimmed);

  writeStore(nextStore);
  return nextStore;
}