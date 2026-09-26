import { createHash } from 'node:crypto';
import canonicalize from './vendor/canonicalize.js';

// canonicalize v5.1.0 (Apache-2.0), vendored unchanged. This wrapper enforces
// eidomancer.jcs.v1's narrower data model and rejects duplicate JSON keys.
export const CANONICALIZATION_VERSION = 'eidomancer.jcs.v1';
const fail = (message) => { throw new Error(message); };

export function parseStrictJson(input) {
  const source = Buffer.isBuffer(input) ? new TextDecoder('utf-8', { fatal: true }).decode(input) : input;
  if (typeof source !== 'string') fail('JSON input must be UTF-8 text');
  let i = 0;
  const ws = () => { while (/\s/.test(source[i] || '') && i < source.length) i++; };
  const string = () => {
    const start = i++;
    while (i < source.length) {
      const c = source[i++];
      if (c === '\\') { i++; continue; }
      if (c === '"') return JSON.parse(source.slice(start, i));
    }
    fail('Unterminated JSON string');
  };
  function value(depth = 0) {
    if (depth > 256) fail('JSON nesting limit');
    ws();
    if (source[i] === '{') {
      i++; ws(); const keys = new Set();
      if (source[i] === '}') { i++; return; }
      for (;;) {
        ws(); if (source[i] !== '"') fail('Invalid JSON object key');
        const key = string(); if (keys.has(key)) fail(`Duplicate JSON key: ${key}`);
        keys.add(key); ws(); if (source[i++] !== ':') fail('Invalid JSON colon');
        value(depth + 1); ws(); const sep = source[i++];
        if (sep === '}') return;
        if (sep !== ',') fail('Invalid JSON separator');
      }
    }
    if (source[i] === '[') {
      i++; ws(); if (source[i] === ']') { i++; return; }
      for (;;) { value(depth + 1); ws(); const sep = source[i++]; if (sep === ']') return; if (sep !== ',') fail('Invalid JSON array'); }
    }
    if (source[i] === '"') { string(); return; }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(i));
    if (!match) fail('Invalid JSON value');
    if (/^-?[0-9]/.test(match[0]) && (/[.eE]/.test(match[0]) || match[0] === '-0')) fail('Only canonical integer tokens are supported');
    i += match[0].length;
  }
  value(); ws(); if (i !== source.length) fail('Trailing JSON text');
  const parsed = JSON.parse(source);
  validateCanonicalValue(parsed);
  return parsed;
}

export function validateCanonicalValue(value, depth = 0) {
  if (depth > 256) fail('JSON nesting limit');
  if (value === null) fail('null is forbidden');
  if (typeof value === 'string') {
    if (value !== value.normalize('NFC') || !value.isWellFormed()) fail('String must be NFC and well formed');
    return;
  }
  if (typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) fail('Only safe nonnegative/negative integers are supported');
    return;
  }
  if (Array.isArray(value)) { for (const item of value) validateCanonicalValue(item, depth + 1); return; }
  if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) fail('Only plain JSON objects are supported');
  for (const [key, item] of Object.entries(value)) {
    validateCanonicalValue(key, depth + 1);
    validateCanonicalValue(item, depth + 1);
  }
}

export function canonicalBytes(value) {
  validateCanonicalValue(value);
  return Buffer.from(canonicalize(value), 'utf8');
}
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function identity(kind, payload) {
  if (!['record', 'crystal'].includes(kind)) fail('Invalid identity kind');
  return `${kind}:sha256:${sha256(canonicalBytes(payload))}`;
}
