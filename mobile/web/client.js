export async function pilotPost(path, body = {}) {
  const response = await fetch(`/api/pilot/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(23000),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "The pilot is unavailable.");
    error.code = result.code;
    throw error;
  }
  return result;
}

const retrySlot = "eidomancer-pilot-retry-v1";

export async function retryId(mode, input) {
  const data = new TextEncoder().encode(JSON.stringify([mode, input]));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  const id = crypto.randomUUID();
  try {
    const saved = JSON.parse(sessionStorage.getItem(retrySlot));
    if (saved?.fingerprint === fingerprint) return saved.id;
    sessionStorage.setItem(retrySlot, JSON.stringify({ fingerprint, id }));
  } catch { /* Reading still works if session storage is blocked. */ }
  return id;
}

export function clearRetry() {
  try { sessionStorage.removeItem(retrySlot); } catch { /* Storage can be disabled. */ }
}
