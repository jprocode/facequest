// frontend/utils/analytics.js
const KEY = 'fq.analytics.reactions';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {}
}

/** Increment a reaction count locally */
export function bumpReaction(emojiType) {
  const data = load();
  data[emojiType] = (data[emojiType] || 0) + 1;
  save(data);
}

/** Return stats sorted by most used */
export function getReactionStats() {
  const data = load();
  const entries = Object.entries(data);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.map(([type, count]) => ({ type, count }));
}