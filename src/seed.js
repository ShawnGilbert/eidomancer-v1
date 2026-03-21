function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function makeRandFrom(parts) {
  const seed = hashString(parts.join("|"));
  let state = seed || 1;

  return function rand() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pick(rand, items) {
  if (!items || items.length === 0) return null;
  const index = Math.floor(rand() * items.length);
  return items[index];
}