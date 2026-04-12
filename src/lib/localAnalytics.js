// D:\eidomancer\src\lib\localAnalytics.js

const ANALYTICS_KEY = "eidomancer_local_analytics_v1";
const MAX_EVENTS = 500;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readEvents() {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(ANALYTICS_KEY);
  if (!raw) return [];

  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeEvents(events = []) {
  if (!isBrowser()) return [];

  const trimmed = Array.isArray(events) ? events.slice(-MAX_EVENTS) : [];
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  return trimmed;
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function logEvent(name, payload = {}) {
  if (!name || typeof name !== "string") {
    throw new Error("logEvent requires an event name.");
  }

  const events = readEvents();
  const nextEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    timestamp: new Date().toISOString(),
    dateKey: todayKey(),
    payload: payload && typeof payload === "object" ? payload : {},
  };

  events.push(nextEvent);
  writeEvents(events);

  return nextEvent;
}

export function getAnalyticsEvents() {
  return readEvents();
}

export function clearAnalyticsEvents() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ANALYTICS_KEY);
}

export function getEventsByName(name) {
  if (!name || typeof name !== "string") return [];
  return readEvents().filter((event) => event.name === name.trim());
}

export function getEventCount(name) {
  return getEventsByName(name).length;
}

export function getEventsForDate(dateKey) {
  if (!dateKey || typeof dateKey !== "string") return [];
  return readEvents().filter((event) => event.dateKey === dateKey.trim());
}

export function hasEventToday(name) {
  const key = todayKey();
  return readEvents().some(
    (event) => event.name === name && event.dateKey === key
  );
}

export function getDailyAnalyticsSummary(dateKey = todayKey()) {
  const events = getEventsForDate(dateKey);

  const summary = {
    dateKey,
    totalEvents: events.length,
    dailyCastGenerated: 0,
    dailyCastViewed: 0,
    shareClicked: 0,
    historyOpened: 0,
    returnedSameDay: 0,
    returnedNextDay: 0,
  };

  for (const event of events) {
    switch (event.name) {
      case "daily_cast_generated":
        summary.dailyCastGenerated += 1;
        break;
      case "daily_cast_viewed":
        summary.dailyCastViewed += 1;
        break;
      case "share_clicked":
        summary.shareClicked += 1;
        break;
      case "history_opened":
        summary.historyOpened += 1;
        break;
      case "returned_same_day":
        summary.returnedSameDay += 1;
        break;
      case "returned_next_day":
        summary.returnedNextDay += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function detectReturnEvent() {
  if (!isBrowser()) return null;

  const LAST_VISIT_KEY = "eidomancer_last_visit_date_v1";
  const today = todayKey();
  const lastVisit = window.localStorage.getItem(LAST_VISIT_KEY);

  let eventName = null;

  if (lastVisit === today) {
    eventName = "returned_same_day";
  } else if (lastVisit) {
    const lastDate = new Date(`${lastVisit}T12:00:00`);
    const thisDate = new Date(`${today}T12:00:00`);

    const diffMs = thisDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 1) {
      eventName = "returned_next_day";
    }
  }

  window.localStorage.setItem(LAST_VISIT_KEY, today);

  if (!eventName) return null;
  return logEvent(eventName, { lastVisit, today });
}