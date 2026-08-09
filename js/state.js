/**
 * State Management
 * Observable store with localStorage persistence.
 * Simple pub/sub pattern — no framework needed.
 */

const STORAGE_KEY = 'merokagaj_state';

const defaults = {
  lang: 'en',
  theme: 'light',
  contrast: 'normal',
  fontSize: 'normal',
  reduceMotion: false,
  bookmarks: [],
  recentPages: [],
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silently ignore */ }
}

const listeners = new Map();

let state = loadPersisted();

export function get(key) {
  return key ? state[key] : { ...state };
}

export function set(key, value) {
  if (state[key] === value) return;
  state[key] = value;
  persist(state);
  notify(key, value);
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

function notify(key, value) {
  const fns = listeners.get(key);
  if (fns) fns.forEach(fn => fn(value));
}

/* ---- Convenience helpers ---- */

export function toggleTheme() {
  set('theme', state.theme === 'dark' ? 'light' : 'dark');
}

export function toggleLang() {
  set('lang', state.lang === 'en' ? 'ne' : 'en');
}

export function addBookmark(serviceId) {
  const bm = [...state.bookmarks];
  const idx = bm.indexOf(serviceId);
  if (idx === -1) bm.push(serviceId);
  set('bookmarks', bm);
}

export function removeBookmark(serviceId) {
  set('bookmarks', state.bookmarks.filter(id => id !== serviceId));
}

export function isBookmarked(serviceId) {
  return state.bookmarks.includes(serviceId);
}

export function addRecentPage(page) {
  const recent = state.recentPages.filter(p => p.id !== page.id);
  recent.unshift({ ...page, timestamp: Date.now() });
  if (recent.length > 20) recent.length = 20;
  set('recentPages', recent);
}

export function getRecentPages() {
  return [...state.recentPages];
}

export function clearRecentPages() {
  set('recentPages', []);
}
