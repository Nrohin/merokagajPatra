/**
 * Services Listing Page
 */

import { t, getLang } from '../i18n.js';
import { createSearchBar, attachSearchListeners } from '../components/search-bar.js';
import * as State from '../state.js';
import { categoryLabel } from '../utils/categories.js';

export async function render({ container }) {
  const lang = getLang();
  const services = await loadJSON('data/services.json');
  const categories = [...new Set(services.map(s => s.category || 'other'))].sort();

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page">${t('nav.services')}</span>
        </nav>
        <h1>${t('allServices')}</h1>
        <p class="subtitle">${t('allServicesDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container">
        <div style="margin-bottom:var(--space-6)">
          ${createSearchBar({ id: 'services-search', placeholder: 'searchPlaceholder' })}
        </div>
        <div class="chip-group" style="margin-bottom:var(--space-6)" id="category-filters">
          <button class="chip active" data-category="all">
            <span class="material-symbols-rounded" aria-hidden="true" style="font-size:14px">filter_alt</span>
            ${t('all')}
          </button>
          ${categories.map(cat => `
            <button class="chip" data-category="${cat}">${categoryLabel(cat)}</button>
          `).join('')}
        </div>
        <div id="services-results" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-4)">
          ${renderCards(services, lang)}
        </div>
      </div>
    </div>
  `;

  attachSearchListeners('services-search');

  const filterContainer = document.getElementById('category-filters');
  const resultsContainer = document.getElementById('services-results');
  let activeCategory = 'all';

  filterContainer?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filterContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.category;
    const filtered = activeCategory === 'all' ? services : services.filter(s => s.category === activeCategory);
    if (resultsContainer) resultsContainer.innerHTML = renderCards(filtered, lang);
  });

  State.addRecentPage({ id: 'services', title: t('nav.services'), icon: 'description', route: '/services' });
}

function renderCards(services, lang) {
  if (services.length === 0) {
    return `<div class="empty-state" style="grid-column:1/-1"><span class="material-symbols-rounded" aria-hidden="true">search_off</span><h3>${t('noServicesFound')}</h3></div>`;
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
        <div class="card-meta">
          <span class="tag tag--primary">${categoryLabel(s.category || 'other')}</span>
        </div>
      </a>
    `;
  }).join('');
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
