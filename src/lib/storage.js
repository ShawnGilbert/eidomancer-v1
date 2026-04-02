const STORAGE_KEY = "eidomancer_recent_casts_v1";

export function loadCasts() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCasts(casts) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(casts));
  } catch {
    // ignore storage failures
  }
}