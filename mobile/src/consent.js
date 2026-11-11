const key = "eidomancer.ai-consent";
export const consentVersion = "openai-reading-v1";

export function readConsent(storage) {
  try { return storage.getItem(key) === consentVersion; }
  catch { return false; }
}

export function writeConsent(storage, allowed) {
  try {
    if (allowed) storage.setItem(key, consentVersion);
    else storage.removeItem(key);
  } catch {
    // Consent still applies to this session when storage is unavailable.
  }
}
