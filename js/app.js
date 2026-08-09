
/**
 * MeroKagaj — Main Application Entry Point
 * Initializes all modules: state, i18n, router, components, pages.
 * Integrates Supabase data layer and hidden admin CMS.
 */

import { CONFIG, isSupabaseConfigured } from './config.js';
import { initDataLayer } from './data-layer.js';
import * as State from './state.js';
import { init as initI18n, t, getLang, onLangChange } from './i18n.js';
import * as Router from './router.js';
import * as Search from './search.js';
import * as Header from './components/header.js';
import * as Footer from './components/footer.js';
import * as SearchBar from './components/search-bar.js';

// Page modules
import * as HomePage from './pages/home.js';
import * as ServicesPage from './pages/services.js';
import * as ServicePage from './pages/service.js';
import * as CategoryPage from './pages/category.js';
import * as LifeEventsPage from './pages/life-events.js';
import * as LifeEventPage from './pages/life-event.js';
import * as FaqPage from './pages/faq.js';
import * as GlossaryPage from './pages/glossary.js';
import * as EmergencyPage from './pages/emergency.js';
import * as OfficesPage from './pages/offices.js';
import * as DepartmentsPage from './pages/departments.js';
import * as NewsPage from './pages/news.js';
import * as BookmarksPage from './pages/bookmarks.js';
import * as CitizenshipPage from './pages/citizenship.js';
import * as BusinessPage from './pages/business.js';
import * as PropertyPage from './pages/property.js';

// Admin CMS (lazy-loaded only when admin route is accessed)
let adminModule = null;
async function loadAdmin() {
  if (!adminModule) {
    adminModule = await import('./admin/index.js');
  }
  return adminModule;
}

/* ============================================================
   Boot Sequence
   ============================================================ */

async function boot() {
  // 1. Apply saved theme immediately (avoid flash)
  applyTheme(State.get('theme'));
  applyContrast(State.get('contrast'));
  applyFontSize(State.get('fontSize'));
  applyFontFamily(State.get('fontFamily') || 'default');
  applyReduceMotion(State.get('reduceMotion'));

  // 2. Initialize data layer (Supabase intercept) BEFORE i18n
  await initDataLayer();

  // 3. Initialize i18n
  await initI18n();

  // 4. Initialize components
  Header.init();
  Footer.init();
  SearchBar.init();

  // 5. Initialize search index (background)
  Search.init().catch(() => {});

  // 6. Register routes
  registerRoutes();

  // 7. Bind global UI
  bindLangToggle();
  bindA11yModal();

  // 8. Remove loading indicator
  const loader = document.getElementById('app-loading');
  if (loader) loader.remove();

  // 9. Start router
  Router.start();

  // 10. Re-render current page when language changes
  onLangChange(() => Router.resolve());

  // 11. Register service worker
  registerServiceWorker();
}

/* ============================================================
   Routes
   ============================================================ */

const ADMIN_PATH = CONFIG.ADMIN_PATH;

function registerRoutes() {
  // Admin CMS routes (registered FIRST so they match before public routes)
  Router.register('/' + ADMIN_PATH, adminHandler);
  Router.register('/' + ADMIN_PATH + '/*', adminHandler);

  // Public routes
  Router.register('/', async ({ container }) => HomePage.render({ container }));
  Router.register('/services', async ({ container }) => ServicesPage.render({ container }));
  Router.register('/citizenship', async ({ container }) => CitizenshipPage.render({ container }));
  Router.register('/business', async ({ container }) => BusinessPage.render({ container }));
  Router.register('/property', async ({ container }) => PropertyPage.render({ container }));
  Router.register('/service/:id', async ({ params, container }) => ServicePage.render({ params, container }));
  Router.register('/category/:slug', async ({ params, container }) => CategoryPage.render({ params, container }));
  Router.register('/life-events', async ({ container }) => LifeEventsPage.render({ container }));
  Router.register('/life-event/:id', async ({ params, container }) => LifeEventPage.render({ params, container }));
  Router.register('/faq', async ({ container }) => FaqPage.render({ container }));
  Router.register('/glossary', async ({ container }) => GlossaryPage.render({ container }));
  Router.register('/emergency', async ({ container }) => EmergencyPage.render({ container }));
  Router.register('/offices', async ({ container }) => OfficesPage.render({ container }));
  Router.register('/office/:id', async ({ params, container }) => OfficesPage.render({ params, container }));
  Router.register('/departments', async ({ container }) => DepartmentsPage.render({ container }));
  Router.register('/department/:id', async ({ params, container }) => DepartmentsPage.render({ params, container }));
  Router.register('/news', async ({ container }) => NewsPage.render({ container }));
  Router.register('/bookmarks', async ({ container }) => BookmarksPage.render({ container }));

  Router.onNotFound(({ container }) => {
    showPublicChrome(true);
    container.innerHTML = `
      <div class="container section">
        <div class="empty-state">
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:64px;color:var(--text-tertiary)">search_off</span>
          <h3 data-i18n="pageNotFound">${t('pageNotFound')}</h3>
          <p>${t('pageNotFoundDesc')}</p>
          <a href="#/" class="btn btn--primary" style="margin-top:var(--space-4)" data-i18n="goHome">${t('goHome')}</a>
        </div>
      </div>
    `;
  });
}

/* ============================================================
   Admin Handler
   ============================================================ */

async function adminHandler({ params, container }) {
  showPublicChrome(false);
  document.body.classList.add('admin-mode');

  try {
    const admin = await loadAdmin();
    const restPath = params.rest || params.page || '';
    return admin.handle(restPath, container);
  } catch (err) {
    console.error('Admin load error:', err);
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:var(--text-secondary)">
      <div style="text-align:center">
        <p>Admin panel is loading...</p>
        <p style="font-size:var(--text-sm);margin-top:var(--space-4)">If this persists, check the console.</p>
      </div>
    </div>`;
  }
}

/* ============================================================
   Show/Hide Public Chrome (header, footer, disclaimer)
   ============================================================ */

function showPublicChrome(show) {
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const disclaimer = document.querySelector('.disclaimer-bar');
  const mobileNav = document.querySelector('.mobile-nav');
  if (header) header.style.display = show ? '' : 'none';
  if (footer) footer.style.display = show ? '' : 'none';
  if (disclaimer) disclaimer.style.display = show ? '' : 'none';
  if (mobileNav) mobileNav.style.display = show ? '' : 'none';
}

/* ============================================================
   Contrast / A11y
   ============================================================ */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyContrast(contrast) {
  document.documentElement.setAttribute('data-contrast', contrast);
}

function applyFontSize(size) {
  document.documentElement.setAttribute('data-font-size', size);
}

function applyReduceMotion(reduce) {
  document.documentElement.setAttribute('data-reduce-motion', reduce ? 'true' : 'false');
}

function applyFontFamily(family) {
  document.documentElement.setAttribute('data-font', family);
}

function bindLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    State.toggleLang();
    updateLangIcon();
  });

  updateLangIcon();
}

function updateLangIcon() {
  const label = document.getElementById('lang-label');
  if (!label) return;
  const lang = getLang();
  label.textContent = lang === 'en' ? 'En/ने' : 'ने/En';
}

function bindA11yModal() {
  const modal = document.getElementById('a11y-modal');
  const openBtn = document.getElementById('a11y-toggle');
  const closeBtn = document.getElementById('a11y-modal-close');
  const body = document.getElementById('a11y-modal-body');

  if (!modal || !openBtn || !body) return;

  openBtn.addEventListener('click', () => {
    renderA11ySettings(body);
    modal.showModal();
  });

  closeBtn?.addEventListener('click', () => modal.close());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

function renderA11ySettings(body) {
  const lang = getLang();
  const current = {
    contrast: State.get('contrast'),
    fontSize: State.get('fontSize'),
    fontFamily: State.get('fontFamily') || 'default',
    reduceMotion: State.get('reduceMotion'),
  };

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-6)">
      <div>
        <label style="display:block;font-weight:var(--weight-semibold);margin-bottom:var(--space-2)">${t('contrast')}</label>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn ${current.contrast === 'normal' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="contrast" data-value="normal">${t('normal')}</button>
          <button class="btn ${current.contrast === 'high' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="contrast" data-value="high">${t('highContrast')}</button>
        </div>
      </div>
      <div>
        <label style="display:block;font-weight:var(--weight-semibold);margin-bottom:var(--space-2)">${t('fontSize')}</label>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn ${current.fontSize === 'normal' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontSize" data-value="normal">${t('default')}</button>
          <button class="btn ${current.fontSize === 'large' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontSize" data-value="large">${t('large')}</button>
          <button class="btn ${current.fontSize === 'x-large' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontSize" data-value="x-large">${t('extraLarge')}</button>
        </div>
      </div>
      <div>
        <label style="display:block;font-weight:var(--weight-semibold);margin-bottom:var(--space-2)">${t('font')}</label>
        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
          <button class="btn ${current.fontFamily === 'default' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontFamily" data-value="default" style="font-family:'Inter',system-ui,sans-serif">${t('default')}</button>
          <button class="btn ${current.fontFamily === 'nepali' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontFamily" data-value="nepali" style="font-family:'Noto Sans Devanagari',sans-serif">नेपाली</button>
          <button class="btn ${current.fontFamily === 'system' ? 'btn--primary' : 'btn--secondary'} btn--sm a11y-opt" data-setting="fontFamily" data-value="system" style="font-family:system-ui,sans-serif">${t('system')}</button>
        </div>
      </div>
      <div>
        <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer">
          <input type="checkbox" id="reduce-motion-cb" ${current.reduceMotion ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--color-primary)">
          <span style="font-weight:var(--weight-semibold)">${t('reduceMotion')}</span>
        </label>
      </div>
    </div>
  `;

  body.querySelectorAll('.a11y-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const setting = btn.dataset.setting;
      const value = btn.dataset.value;
      State.set(setting, value);
      if (setting === 'contrast') applyContrast(value);
      if (setting === 'fontSize') applyFontSize(value);
      if (setting === 'fontFamily') applyFontFamily(value);
      renderA11ySettings(body);
    });
  });

  document.getElementById('reduce-motion-cb')?.addEventListener('change', (e) => {
    State.set('reduceMotion', e.target.checked);
    applyReduceMotion(e.target.checked);
  });
}

/* ============================================================
   Service Worker
   ============================================================ */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

/* ============================================================
   Boot!
   ============================================================ */

let booted = false;

function safeBoot() {
  if (booted) return;
  booted = true;
  boot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeBoot);
} else {
  safeBoot();
}
