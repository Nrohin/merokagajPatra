/**
 * Bookmarks Page
 */

import * as State from '../state.js';
import { t, getLang } from '../i18n.js';
import { showToast } from '../utils/dom.js';

export async function render({ container }) {
  const lang = getLang();
  const bookmarks = State.get('bookmarks');
  const recent = State.get('recentPages');
  const services = await loadJSON('data/services.json');

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.bookmarks">${t('nav.bookmarks')}</span>
        </nav>
        <h1 data-i18n="yourBookmarks">${t('yourBookmarks')}</h1>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:800px">
        <!-- Bookmarks -->
        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;vertical-align:middle;margin-right:var(--space-2);color:var(--color-accent)">bookmark</span>
          ${t('savedServices')} (${bookmarks.length})
        </h2>
        ${bookmarks.length === 0 ? `
          <div class="card" style="text-align:center;padding:var(--space-8)">
            <span class="material-symbols-rounded" aria-hidden="true" style="font-size:48px;color:var(--text-tertiary);display:block;margin-bottom:var(--space-3)">bookmark_border</span>
            <p style="color:var(--text-secondary)">${t('noBookmarksYet')}</p>
            <a href="#/services" class="btn btn--primary" style="margin-top:var(--space-4)">${t('browseServices')}</a>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:var(--space-3)" id="bookmarks-list">
            ${bookmarks.map(id => {
              const s = services.find(srv => srv.id === id);
              const name = s ? (lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en) : id;
              const icon = s?.icon || 'description';
              return `
                <div class="card" style="padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
                  <a href="#/service/${id}" style="flex:1;display:flex;align-items:center;gap:var(--space-3);text-decoration:none;color:inherit">
                    <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--text-tertiary)">${icon}</span>
                    <span style="font-weight:var(--weight-medium);font-size:var(--text-sm)">${name}</span>
                  </a>
                  <button class="icon-btn remove-bookmark" data-id="${id}" aria-label="${t('removeBookmark')}" style="width:32px;height:32px">
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px;color:var(--color-error)">delete</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Recent -->
        ${recent.length > 0 ? `
          <hr class="divider">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
            <h2 style="font-size:var(--text-xl)">
              <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;vertical-align:middle;margin-right:var(--space-2);color:var(--text-secondary)">history</span>
              ${t('recentlyViewed')}
            </h2>
            <button class="btn btn--ghost btn--sm" id="clear-recent">${t('clearAll')}</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${recent.map(p => `
              <a href="#${p.route || '#'}" class="card card--link" style="padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
                <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px;color:var(--text-tertiary)">${p.icon || 'description'}</span>
                <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${p.title}</span>
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Remove bookmark buttons
  document.querySelectorAll('.remove-bookmark').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      State.removeBookmark(id);
      const item = btn.closest('.card');
      if (item) {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.2s';
        setTimeout(() => item.remove(), 200);
      }
      showToast(t('bookmarkRemoved'), 'info');
    });
  });

  // Clear recent
  document.getElementById('clear-recent')?.addEventListener('click', () => {
    State.clearRecentPages();
    render({ container });
  });

  State.addRecentPage({ id: 'bookmarks', title: t('nav.bookmarks'), icon: 'bookmark', route: '/bookmarks' });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
