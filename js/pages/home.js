/**
 * Home Page
 * Hero search, categories, life events, recent, bookmarks.
 */

import * as State from '../state.js';
import { t, getLang } from '../i18n.js';
import { createSearchBar, attachSearchListeners } from '../components/search-bar.js';
import { extractCategories, CATEGORY_ICONS } from '../utils/categories.js';

export async function render({ container }) {
  const lang = getLang();
  const [services, lifeEvents] = await Promise.all([
    loadJSON('data/services.json'),
    loadJSON('data/life-events.json'),
  ]);

  const categories = extractCategories(services);
  const recent = State.get('recentPages').slice(0, 5);

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section" style="background:var(--bg-secondary);padding:var(--space-12) 0 var(--space-10)">
      <div class="container" style="text-align:center;max-width:700px">
        <h1 style="font-size:var(--text-4xl);margin-bottom:var(--space-3);letter-spacing:var(--tracking-tight)">
          ${t('heroTitle')}
        </h1>
        <p style="font-size:var(--text-md);color:var(--text-secondary);margin-bottom:var(--space-8);line-height:var(--leading-relaxed)">
          ${t('heroSubtitle')}
        </p>
        <div style="max-width:560px;margin:0 auto">
          ${createSearchBar({ id: 'hero-search', placeholder: 'searchPlaceholder', large: true })}
        </div>
        <div style="margin-top:var(--space-4);display:flex;justify-content:center;gap:var(--space-2);flex-wrap:wrap">
          <span style="font-size:var(--text-xs);color:var(--text-tertiary)">${t('popularSearches')}</span>
          ${[
            { en: 'Citizenship', ne: 'nagarikta' },
            { en: 'Passport', ne: 'passport' },
            { en: 'Driving License', ne: 'chalak parmit' },
            { en: 'Birth Certificate', ne: 'janma darta' },
          ].map(item => `
            <a href="#/services" class="chip" style="font-size:var(--text-xs)">${item.en} <span style="color:var(--text-tertiary);font-size:0.7rem;margin-left:2px">${item.ne}</span></a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 style="font-size:var(--text-2xl)">${t('categories')}</h2>
          <a href="#/services" class="btn btn--ghost btn--sm">
            ${t('viewAll')} <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">arrow_forward</span>
          </a>
        </div>
        <div class="grid grid-2" style="gap:var(--space-4)">
          ${categories.map(cat => `
            <a href="#/category/${cat.slug}" class="card card--link">
              <div class="card-icon">
                <span class="material-symbols-rounded" aria-hidden="true">${cat.icon}</span>
              </div>
              <h3 class="card-title">${cat.name}</h3>
              <p class="card-desc">${cat.count} ${t('servicesAvailable')}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Life Events Section -->
    <section class="section section--bg">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 style="font-size:var(--text-2xl)">${t('lifeEvents')}</h2>
          <a href="#/life-events" class="btn btn--ghost btn--sm">
            ${t('viewAll')} <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">arrow_forward</span>
          </a>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-6);max-width:600px">
          ${t('lifeEventsDesc')}
        </p>
        <div class="grid grid-2" style="gap:var(--space-4)">
          ${(lifeEvents || []).slice(0, 10).map(evt => `
            <a href="#/life-event/${evt.id}" class="card card--link">
              <div class="card-icon" style="background:var(--color-accent-50);color:var(--color-accent-dark)">
                <span class="material-symbols-rounded" aria-hidden="true">${evt.icon || 'star'}</span>
              </div>
              <h3 class="card-title">${lang === 'ne' ? (evt.name?.ne || evt.name?.en) : evt.name?.en}</h3>
              <p class="card-desc">${lang === 'ne' ? (evt.description?.ne || evt.description?.en) : evt.description?.en}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Recent Pages & Quick Access -->
    <section class="section">
      <div class="container">
        <div style="display:grid;grid-template-columns:1fr;gap:var(--space-8)">
          ${recent.length > 0 ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">
                <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;vertical-align:middle;margin-right:var(--space-2);color:var(--text-secondary)">history</span>
                ${t('recentPages')}
              </h2>
              <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                ${recent.map(page => `
                  <a href="#${page.route || '#'}" class="card card--link" style="padding:var(--space-3) var(--space-4)">
                    <div style="display:flex;align-items:center;gap:var(--space-3)">
                      <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px;color:var(--text-tertiary)">${page.icon || 'description'}</span>
                      <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${page.title}</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div>
            <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">${t('quickAccess')}</h2>
            <div class="grid grid-3" style="gap:var(--space-3)">
              <a href="#/offices" class="card card--link" style="padding:var(--space-4);text-align:center">
                <span class="material-symbols-rounded" aria-hidden="true" style="font-size:32px;color:var(--color-primary);display:block;margin-bottom:var(--space-2)">location_on</span>
                <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${t('findOffice')}</span>
              </a>
              <a href="#/glossary" class="card card--link" style="padding:var(--space-4);text-align:center">
                <span class="material-symbols-rounded" aria-hidden="true" style="font-size:32px;color:var(--color-accent);display:block;margin-bottom:var(--space-2)">menu_book</span>
                <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${t('glossary')}</span>
              </a>
              <a href="#/emergency" class="card card--link" style="padding:var(--space-4);text-align:center">
                <span class="material-symbols-rounded" aria-hidden="true" style="font-size:32px;color:var(--color-error);display:block;margin-bottom:var(--space-2)">emergency</span>
                <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${t('emergencyNumbers')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  attachSearchListeners('hero-search');

  State.addRecentPage({
    id: 'home',
    title: t('nav.home'),
    icon: 'home',
    route: '/',
  });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
