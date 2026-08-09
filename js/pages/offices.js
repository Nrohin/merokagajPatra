/**
 * Offices Directory Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ params, container }) {
  const lang = getLang();
  const offices = await loadJSON('data/offices.json');
  const provinces = [...new Set(offices.map(o => o.province || 'Bagmati'))].sort();

  if (params?.id) {
    return renderOfficeDetail(params.id, offices, lang, container);
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.offices">${t('nav.offices')}</span>
        </nav>
        <h1 data-i18n="governmentOffices">${t('governmentOffices')}</h1>
        <p class="subtitle" data-i18n="officesDesc">${t('officesDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container">
        <div class="chip-group" style="margin-bottom:var(--space-6)" id="province-filters">
          <button class="chip active" data-province="all">${t('allProvinces')}</button>
          ${provinces.map(p => `<button class="chip" data-province="${p}">${p}</button>`).join('')}
        </div>
        <div id="offices-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-4)">
          ${renderOfficeCards(offices, lang)}
        </div>
      </div>
    </div>
  `;

  // Province filter
  document.getElementById('province-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#province-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const prov = chip.dataset.province;
    const filtered = prov === 'all' ? offices : offices.filter(o => o.province === prov);
    document.getElementById('offices-list').innerHTML = renderOfficeCards(filtered, lang);
  });

  State.addRecentPage({ id: 'offices', title: t('nav.offices'), icon: 'location_on', route: '/offices' });
}

/**
 * Resolve a localized field (address, hours, bestTime) for the current language.
 * Accepts either a plain string or an { en, ne } object.
 */
function localized(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return lang === 'ne' ? (value.ne || value.en || '') : (value.en || '');
}

function renderOfficeCards(offices, lang) {
  return offices.map(o => {
    const name = lang === 'ne' ? (o.name?.ne || o.name?.en) : o.name?.en;
    return `
      <div class="card" style="padding:var(--space-4)">
        <div style="display:flex;align-items:flex-start;gap:var(--space-3)">
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;color:var(--color-primary);margin-top:2px">apartment</span>
          <div style="flex:1">
            <h3 style="font-size:var(--text-base);font-weight:var(--weight-semibold);margin-bottom:var(--space-1)">${name}</h3>
            <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-2)">${localized(o.address, lang)}</p>
            ${o.phone ? `<p style="font-size:var(--text-sm);display:flex;align-items:center;gap:var(--space-1)"><span class="material-symbols-rounded" style="font-size:14px;color:var(--text-tertiary)">call</span> ${o.phone}</p>` : ''}
            ${o.bestTime ? `<p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-2)"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle">schedule</span> ${localized(o.bestTime, lang)}</p>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-1)">
            ${o.mapUrl ? `<a href="${o.mapUrl}" class="icon-btn" target="_blank" rel="noopener" aria-label="${t('viewOnMap')}" title="${t('map')}"><span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px">map</span></a>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOfficeDetail(id, offices, lang, container) {
  const office = offices.find(o => o.id === id);
  if (!office) {
    container.innerHTML = `<div class="container section"><div class="empty-state"><span class="material-symbols-rounded" aria-hidden="true">location_off</span><h3>${t('officeNotFound')}</h3></div></div>`;
    return;
  }
  const name = lang === 'ne' ? (office.name?.ne || office.name?.en) : office.name?.en;

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs"><a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/offices" class="breadcrumb-link">${t('nav.offices')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${name}</span>
      </nav>
    </div>
    <div class="section"><div class="container" style="max-width:700px">
      <h1 style="margin-bottom:var(--space-4)">${name}</h1>
      ${office.address ? `<p style="margin-bottom:var(--space-3)"><strong>${t('address')}:</strong> ${localized(office.address, lang)}</p>` : ''}
      ${office.phone ? `<p style="margin-bottom:var(--space-3)"><strong>${t('phone')}:</strong> <a href="tel:${office.phone}">${office.phone}</a></p>` : ''}
      ${office.email ? `<p style="margin-bottom:var(--space-3)"><strong>${t('email')}:</strong> <a href="mailto:${office.email}">${office.email}</a></p>` : ''}
      ${office.hours ? `<p style="margin-bottom:var(--space-3)"><strong>${t('hours')}:</strong> ${localized(office.hours, lang)}</p>` : ''}
      ${office.bestTime ? `<div class="info-box info-box--info" style="margin-top:var(--space-4)"><span class="material-symbols-rounded" aria-hidden="true">tips_and_updates</span><div><strong>${t('bestTimeToVisit')}:</strong> ${localized(office.bestTime, lang)}</div></div>` : ''}
      ${office.mapUrl ? `<a href="${office.mapUrl}" class="btn btn--primary" target="_blank" rel="noopener" style="margin-top:var(--space-6)"><span class="material-symbols-rounded" aria-hidden="true">map</span> ${t('viewOnMap')}</a>` : ''}
    </div></div>
  `;
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
