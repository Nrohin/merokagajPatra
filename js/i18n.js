/**
 * Internationalization (i18n)
 * Supports English and Nepali. Loads both languages at init for fallback.
 */

import * as State from './state.js';

const translations = { en: null, ne: null };
let currentLang = State.get('lang');
let onLangChangeCb = null;

/**
 * Load translation file for a language.
 */
async function loadTranslations(lang) {
  if (translations[lang]) return translations[lang];
  try {
    const res = await fetch(`data/translations/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations[lang] = await res.json();
    return translations[lang];
  } catch (err) {
    console.warn(`i18n: Could not load ${lang} translations:`, err.message);
    translations[lang] = {};
    return translations[lang];
  }
}

/**
 * Initialize i18n — load BOTH languages so fallback always works.
 */
export async function init() {
  // Load both languages in parallel so EN fallback is always available
  await Promise.all([
    loadTranslations('en'),
    loadTranslations('ne'),
  ]);

  State.subscribe('lang', (lang) => {
    currentLang = lang;
    applyToDOM();
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
    if (onLangChangeCb) onLangChangeCb(lang);
  });
}

/**
 * Get a translated string by key.
 * Supports dot notation: t('nav.home')
 * Supports interpolation: t('greeting', { name: 'Ram' })
 * Falls back: current lang -> English -> last segment of key
 */
export function t(key, vars = {}) {
  if (!key) return '';

  // Try current language first
  let value = resolve(translations[currentLang], key);

  // Fallback to English
  if (value == null && currentLang !== 'en') {
    value = resolve(translations.en, key);
  }

  // Last resort: return the last segment, capitalized (e.g., "nav.home" -> "Home")
  if (value == null) {
    value = humanize(key);
  }

  if (typeof value === 'string' && Object.keys(vars).length > 0) {
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] !== undefined ? vars[name] : `{${name}}`
    );
  }

  return value;
}

/**
 * Resolve a dotted key against a dictionary.
 */
function resolve(dict, key) {
  if (!dict) return null;
  // Flat lookup first (e.g., dict["cat.civil"])
  if (dict[key] !== undefined) return dict[key];
  // Nested fallback (e.g., dict.cat.civil)
  return key.split('.').reduce((obj, k) => (obj != null && obj[k] !== undefined) ? obj[k] : null, dict);
}

/**
 * Convert a dotted key to a readable label.
 * "nav.home" -> "Home", "footerAbout" -> "About", "search.service" -> "Service"
 */
function humanize(key) {
  const last = key.split('.').pop();
  // Convert camelCase/PascalCase to words, then capitalize
  return last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get current language.
 */
export function getLang() {
  return currentLang;
}

/**
 * Register a callback for when language changes.
 * Used by app.js to re-render the current page.
 */
export function onLangChange(fn) {
  onLangChangeCb = fn;
}

/**
 * Apply translations to all elements with data-i18n attribute.
 */
export function applyToDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}
