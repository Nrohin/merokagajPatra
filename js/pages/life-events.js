/**
 * Life Events Listing Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ container }) {
  const lang = getLang();
  const events = await loadJSON('data/life-events.json');
  const services = await loadJSON('data/services.json');

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.lifeEvents">${t('nav.lifeEvents')}</span>
        </nav>
        <h1 data-i18n="lifeEvents">${t('lifeEvents')}</h1>
        <p class="subtitle" data-i18n="lifeEventsDesc">${t('lifeEventsDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-4)">
          ${(events || []).map(evt => {
            const name = lang === 'ne' ? (evt.name?.ne || evt.name?.en) : evt.name?.en;
            const desc = lang === 'ne' ? (evt.description?.ne || evt.description?.en) : evt.description?.en;
            const count = evt.services?.length || 0;
            return `
              <a href="#/life-event/${evt.id}" class="card card--link">
                <div class="card-icon" style="background:var(--color-accent-50);color:var(--color-accent-dark)">
                  <span class="material-symbols-rounded" aria-hidden="true">${evt.icon || 'star'}</span>
                </div>
                <h3 class="card-title">${name}</h3>
                <p class="card-desc">${desc}</p>
                <div class="card-meta">
                  <span class="card-meta-item">
                    <span class="material-symbols-rounded" aria-hidden="true">description</span>
                    ${count} ${lang === 'ne' ? 'सेवाहरू' : 'services'}
                  </span>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  State.addRecentPage({ id: 'life-events', title: t('nav.lifeEvents'), icon: 'celebration', route: '/life-events' });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
