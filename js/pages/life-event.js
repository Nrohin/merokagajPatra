/**
 * Life Event Detail Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ params, container }) {
  const lang = getLang();
  const events = await loadJSON('data/life-events.json');
  const allServices = await loadJSON('data/services.json');
  const event = events.find(e => e.id === params.id);

  if (!event) {
    container.innerHTML = `<div class="container section"><div class="empty-state">
      <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
      <h3>${t('lifeEventNotFound')}</h3>
      <a href="#/life-events" class="btn btn--primary" style="margin-top:var(--space-4)">${t('browseLifeEvents')}</a>
    </div></div>`;
    return;
  }

  const name = lang === 'ne' ? (event.name?.ne || event.name?.en) : event.name?.en;
  const desc = lang === 'ne' ? (event.description?.ne || event.description?.en) : event.description?.en;
  const eventServices = (event.services || []).map(id => allServices.find(s => s.id === id)).filter(Boolean);

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/life-events" class="breadcrumb-link" data-i18n="nav.lifeEvents">${t('nav.lifeEvents')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${name}</span>
      </nav>
    </div>
    <div class="page-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-3)">
          <div class="card-icon" style="background:var(--color-accent-50);color:var(--color-accent-dark)">
            <span class="material-symbols-rounded" aria-hidden="true">${event.icon || 'star'}</span>
          </div>
          <h1>${name}</h1>
        </div>
        <p class="subtitle">${desc}</p>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:900px">
        ${event.tips?.length ? `
          <div class="info-box info-box--info" style="margin-bottom:var(--space-8)">
            <span class="material-symbols-rounded" aria-hidden="true">lightbulb</span>
            <div>
              <strong>${t('tips')}:</strong> ${(event.tips || []).map(tip =>
                lang === 'ne' ? (tip?.ne || tip?.en) : tip?.en
              ).join('. ')}.
            </div>
          </div>
        ` : ''}

        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">${t('relatedServices')} (${eventServices.length})</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-4)">
          ${eventServices.map(s => {
            const sName = lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en;
            const sDesc = lang === 'ne' ? (s.description?.ne || s.description?.en) : s.description?.en;
            return `
              <a href="#/service/${s.id}" class="card card--link">
                <div class="card-icon">
                  <span class="material-symbols-rounded" aria-hidden="true">${s.icon || 'description'}</span>
                </div>
                <h3 class="card-title">${sName}</h3>
                <p class="card-desc">${sDesc || ''}</p>
              </a>
            `;
          }).join('')}
          ${eventServices.length === 0 ? `<p style="color:var(--text-secondary);grid-column:1/-1">${t('noServicesLinked')}</p>` : ''}
        </div>
      </div>
    </div>
  `;

  State.addRecentPage({ id: event.id, title: name, icon: event.icon || 'star', route: `/life-event/${event.id}` });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
