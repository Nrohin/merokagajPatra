/**
 * Departments Directory Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ params, container }) {
  const lang = getLang();
  const departments = await loadJSON('data/departments.json');

  if (params?.id) {
    return renderDeptDetail(params.id, departments, lang, container);
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.departments">${t('nav.departments')}</span>
        </nav>
        <h1 data-i18n="governmentDepartments">${t('governmentDepartments')}</h1>
        <p class="subtitle" data-i18n="departmentsDesc">${t('departmentsDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-4)">
          ${(departments || []).map(d => {
            const name = lang === 'ne' ? (d.name?.ne || d.name?.en) : d.name?.en;
            const desc = lang === 'ne' ? (d.description?.ne || d.description?.en) : d.description?.en;
            return `
              <a href="#/department/${d.id}" class="card card--link" style="padding:var(--space-5)">
                <div style="display:flex;align-items:flex-start;gap:var(--space-3)">
                  <div class="card-icon" style="flex-shrink:0">
                    <span class="material-symbols-rounded" aria-hidden="true">account_balance</span>
                  </div>
                  <div>
                    <h3 class="card-title">${name}</h3>
                    <p class="card-desc">${desc || ''}</p>
                    ${d.website ? `<div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-link)">${d.website}</div>` : ''}
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  State.addRecentPage({ id: 'departments', title: t('nav.departments'), icon: 'account_balance', route: '/departments' });
}

function renderDeptDetail(id, departments, lang, container) {
  const dept = departments.find(d => d.id === id);
  if (!dept) {
    container.innerHTML = `<div class="container section"><div class="empty-state"><span class="material-symbols-rounded" aria-hidden="true">search_off</span><h3>${t('departmentNotFound')}</h3></div></div>`;
    return;
  }
  const name = lang === 'ne' ? (dept.name?.ne || dept.name?.en) : dept.name?.en;
  const desc = lang === 'ne' ? (dept.description?.ne || dept.description?.en) : dept.description?.en;

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs"><a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/departments" class="breadcrumb-link">${t('nav.departments')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${name}</span>
      </nav>
    </div>
    <div class="section"><div class="container" style="max-width:700px">
      <h1 style="margin-bottom:var(--space-4)">${name}</h1>
      <p style="color:var(--text-secondary);line-height:var(--leading-relaxed);margin-bottom:var(--space-6)">${desc}</p>
      ${dept.website ? `<p style="margin-bottom:var(--space-3)"><strong>${t('website')}:</strong> <a href="${dept.website}" target="_blank" rel="noopener">${dept.website}</a></p>` : ''}
      ${dept.phone ? `<p style="margin-bottom:var(--space-3)"><strong>${t('phone')}:</strong> <a href="tel:${dept.phone}">${dept.phone}</a></p>` : ''}
      ${dept.email ? `<p style="margin-bottom:var(--space-3)"><strong>${t('email')}:</strong> <a href="mailto:${dept.email}">${dept.email}</a></p>` : ''}
      ${dept.services?.length ? `
        <h2 style="font-size:var(--text-xl);margin-top:var(--space-8);margin-bottom:var(--space-4)">${t('nav.services')} (${dept.services.length})</h2>
        <div style="display:flex;flex-direction:column;gap:var(--space-2)">
          ${dept.services.map(sid => `<a href="#/service/${sid}" class="card card--link" style="padding:var(--space-3) var(--space-4)"><span class="material-symbols-rounded" style="font-size:18px;color:var(--text-tertiary);vertical-align:middle;margin-right:var(--space-2)">description</span>${sid}</a>`).join('')}
        </div>
      ` : ''}
    </div></div>
  `;
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
