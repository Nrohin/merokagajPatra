
/**
 * Hash-based SPA Router
 * Maps URL fragments to page renderers.
 * Supports :param and * (wildcard) patterns.
 */

import { t } from './i18n.js';

const routes = [];
let notFoundHandler = null;
let currentCleanup = null;

/**
 * Register a route.
 * @param {string} pattern - e.g. '/service/:id', '/manage-*'
 *   Supports :name (single segment) and * (wildcard — captures rest of path as 'rest')
 * @param {Function} handler - async ({ params, container }) => cleanup?
 */
export function register(pattern, handler) {
  const paramNames = [];
  let regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  // Support wildcard * at end
  regexStr = regexStr.replace(/\*$/, () => {
    paramNames.push('rest');
    return '(.*)';
  });
  routes.push({
    pattern,
    regex: new RegExp('^' + regexStr + '$'),
    paramNames,
    handler,
  });
}

export function onNotFound(handler) {
  notFoundHandler = handler;
}

/**
 * Start listening to hash changes.
 */
export function start() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

/**
 * Navigate to a hash path.
 */
export function navigate(path) {
  window.location.hash = '#' + path;
}

/**
 * Get current hash path.
 */
export function getPath() {
  return window.location.hash.slice(1) || '/';
}

/**
 * Resolve the current hash to a route.
 */
async function resolve() {
  const path = getPath();
  const container = document.getElementById('main-content');
  if (!container) return;

  // Cleanup previous page
  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Find matching route
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      try {
        currentCleanup = await route.handler({ params, container });
      } catch (err) {
        console.error('Route error:', err);
        container.innerHTML = `<div class="container section"><div class="empty-state">
          <span class="material-symbols-rounded" aria-hidden="true">error</span>
          <h3>${t('errorTitle')}</h3>
          <p>${t('errorDesc')}</p>
        </div></div>`;
      }
      return;
    }
  }

  // No match — 404
  if (notFoundHandler) {
    currentCleanup = await notFoundHandler({ path, container });
  } else {
    container.innerHTML = `<div class="container section"><div class="empty-state">
      <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
      <h3 data-i18n="pageNotFound">Page not found</h3>
      <p>The page you're looking for doesn't exist. <a href="#/" data-i18n="goHome">Go to the home page</a>.</p>
    </div></div>`;
  }
}

export { resolve };
