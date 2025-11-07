// frontend/utils/memories.js
const KEY = 'fq.memories.v1';

// ---------- internal load/save ----------
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
}

// ---------- public API ----------
export function listMemories() {
  const arr = load();
  return arr.sort((a, b) => b.ts - a.ts);
}

export function getMemory(id) {
  return load().find(m => m.id === id) || null;
}

export function deleteMemory(id) {
  save(load().filter(m => m.id !== id));
}

export function updateMemory(id, patch = {}) {
  const arr = load();
  const idx = arr.findIndex(m => m.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch };
  save(arr);
  return arr[idx];
}

/**
 * Back-compat: Save a single flattened image (your original behavior).
 * Returns the created memory item ({ id, dataUrl, tags, caption, ts }).
 */
export async function saveMemory({ dataUrl, tags = [], caption = '' }) {
  const compressed = await downscale(dataUrl, 960); // max width 960px
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dataUrl: compressed,
    tags,
    caption,
    ts: Date.now(),
    // Mark as legacy single-image
    type: 'single',
  };
  const arr = load();
  arr.push(item);
  save(arr);
  return item;
}

/**
 * NEW (Week 3): Save a full bundle with merged + per-layer variants.
 * @param {Object} p
 *  - merged: dataURL (required)
 *  - video: dataURL (optional)
 *  - drawing: dataURL (optional)
 *  - reactions: dataURL (optional)
 *  - tags: string[] (optional)
 *  - caption: string (optional)
 * Returns the created memory item.
 */
export async function saveMemoryBundle(p) {
  const {
    merged,
    video = null,
    drawing = null,
    reactions = null,
    tags = [],
    caption = '',
  } = p || {};

  if (!merged) throw new Error('saveMemoryBundle: merged image is required');

  const [mOut, vOut, dOut, rOut] = await Promise.all([
    downscale(merged, 960),
    video ? downscale(video, 960) : Promise.resolve(null),
    drawing ? downscale(drawing, 960) : Promise.resolve(null),
    reactions ? downscale(reactions, 960) : Promise.resolve(null),
  ]);

  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    type: 'bundle', // identify new format
    merged: mOut,
    video: vOut,
    drawing: dOut,
    reactions: rOut,
    tags,
    caption,
  };

  const arr = load();
  arr.push(item);
  save(arr);
  return item;
}

// ---------- helpers ----------
async function downscale(srcDataUrl, maxW = 960) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height;
      const scale = w > maxW ? maxW / w : 1;
      const tw = Math.round(w * scale);
      const th = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = tw; c.height = th;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, tw, th);
      // JPEG for smaller file, fallback handled by callers if needed
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(srcDataUrl);
    img.src = srcDataUrl;
  });
}