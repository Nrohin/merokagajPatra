/**
 * Category Page
 * Shows services within a specific category with search/filter.
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';
import { categoryLabel } from '../utils/categories.js';
import { createSearchBar, attachSearchListeners } from '../components/search-bar.js';

export async function render({ params, container }) {
  const lang = getLang();
  const category = params.slug;
  const services = await loadJSON('data/services.json');
  const filtered = services.filter(s => s.category === category);

  const catLabel = categoryLabel(category);

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <a href="#/services" class="breadcrumb-link">${t('nav.services')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page">${catLabel}</span>
        </nav>
        <h1>${catLabel}</h1>
        <p class="subtitle">${filtered.length} ${t('servicesAvailable')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container">
        <!-- Search Bar -->
        <div style="margin-bottom:var(--space-6)">
          ${createSearchBar({ id: 'category-search', placeholder: 'searchPlaceholder' })}
        </div>

        <!-- Service count -->
        <div id="category-count" style="margin-bottom:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary)">
          ${t('all')} ${filtered.length} ${t('servicesAvailable')}
        </div>

        <!-- Service Cards Grid -->
        <div id="category-results" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-4)">
          ${renderCards(filtered, lang)}
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <span class="material-symbols-rounded" aria-hidden="true">folder_open</span>
            <h3>${t('noServicesInCategory')}</h3>
            <a href="#/services" class="btn btn--primary" style="margin-top:var(--space-4)">${t('browseAllServices')}</a>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Initialize search
  attachSearchListeners('category-search');

  // Add local category search (filters the visible service cards)
  const searchInput = document.getElementById('category-search');
  const resultsContainer = document.getElementById('category-results');
  const countEl = document.getElementById('category-count');

  if (searchInput && resultsContainer) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        resultsContainer.innerHTML = renderCards(filtered, lang);
        if (countEl) countEl.textContent = `${t('all')} ${filtered.length} ${t('servicesAvailable')}`;
        return;
      }

      const matched = filtered.filter(s => {
        const name = (s.name?.en || '').toLowerCase() + ' ' + (s.name?.ne || '').toLowerCase();
        const desc = (s.description?.en || '').toLowerCase() + ' ' + (s.description?.ne || '').toLowerCase();
        const keywords = (s.keywords || []).join(' ').toLowerCase();
        const subCat = (s.subCategory || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || keywords.includes(query) || subCat.includes(query);
      });

      resultsContainer.innerHTML = renderCards(matched, lang);
      if (countEl) countEl.textContent = `${matched.length} ${t('servicesAvailable')}`;
    });
  }

  State.addRecentPage({ id: `cat-${category}`, title: catLabel, icon: 'folder', route: `/category/${category}` });
}

function renderCards(services, lang) {
  if (services.length === 0) {
    return `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
        <h3>${t('noServicesFound')}</h3>
      </div>
    `;
  }

  return services.map(s => {
    const name = lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en;
    const desc = lang === 'ne' ? (s.description?.ne || s.description?.en) : s.description?.en;
    return `
      <a href="#/service/${s.id}" class="card card--link">
        <div class="card-icon">
          <span class="material-symbols-rounded" aria-hidden="true">${s.icon || 'description'}</span>
        </div>
        <h3 class="card-title">${name}</h3>
        <p class="card-desc">${desc || ''}</p>
        ${s.subCategory ? `<div class="card-meta"><span class="tag tag--outline">${t('sub.' + s.subCategory)}</span></div>` : ''}
      </a>
    `;
  }).join('');
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
