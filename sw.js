/**
 * MeroKagaj Service Worker
 * - Network-first: app shell (/) and data JSON — always fresh.
 * - Stale-while-revalidate: JS/CSS — serve cached instantly, refresh in
 *   background so updates appear on the next load without manual cache clears.
 * Bump CACHE_NAME whenever you deploy code changes to force a full refresh.
 */

const CACHE_NAME = 'merokagaj-v18';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/admin.css',
  '/js/app.js',
  '/js/config.js',
  '/js/supabase.js',
  '/js/data-layer.js',
  '/js/state.js',
  '/js/router.js',
  '/js/i18n.js',
  '/js/search.js',
  '/js/utils/dom.js',
  '/js/utils/calendar.js',
  '/js/utils/pdf.js',
  '/js/utils/categories.js',
  '/js/components/header.js',
  '/js/components/footer.js',
  '/js/components/search-bar.js',
  '/js/components/dao-selector.js',
  '/js/admin/index.js',
  '/js/admin/auth.js',
  '/js/admin/db.js',
  '/js/admin/store.js',
  '/js/admin/ui.js',
  '/js/admin/layout.js',
  '/js/admin/login.js',
  '/js/admin/dashboard.js',
  '/js/admin/crud.js',
  '/js/admin/editors/services.js',
  '/js/admin/editors/departments.js',
  '/js/admin/editors/offices.js',
  '/js/admin/editors/daos.js',
  '/js/admin/editors/forms.js',
  '/js/admin/editors/fees.js',
  '/js/admin/editors/processing.js',
  '/js/admin/editors/faqs.js',
  '/js/admin/editors/glossary.js',
  '/js/admin/editors/emergency.js',
  '/js/admin/editors/news.js',
  '/js/admin/editors/lifeEvents.js',
  '/js/admin/editors/translations.js',
  '/js/admin/editors/administrators.js',
  '/js/admin/editors/audit.js',
  '/js/admin/editors/settings.js',
  '/manifest.json',
  '/mkfavicon.svg',
];

// Network-first: the app shell (so HTML always references the newest files),
// data JSON, and the local config override. Served from network first, falling
// back to cache only when offline — so CMS changes reach users without them
// clearing anything, and the site still works offline.
const NETWORK_FIRST = ['/', '/index.html', '/data/', '/js/config.local.js'];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for shell/data, stale-while-revalidate for JS/CSS
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip cross-origin (fonts, etc.) — let browser handle
  if (url.origin !== self.location.origin) return;

  // Network-first for shell + data + config — fresh when online, cache when offline
  if (NETWORK_FIRST.some((p) => url.pathname.startsWith(p) || url.pathname === p)) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS/other same-origin assets:
  // serve the cached copy instantly, fetch the newest in the background and
  // store it — so the NEXT visit always runs the latest code.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
