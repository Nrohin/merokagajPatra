/**
 * Emergency Numbers Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ container }) {
  const lang = getLang();
  const numbers = await loadJSON('data/emergency.json');

  container.innerHTML = `
    <div class="page-header" style="background:var(--color-error-light);border-bottom-color:var(--color-error)">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="emergencyNumbers">${t('emergencyNumbers')}</span>
        </nav>
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:36px;color:var(--color-error)">emergency</span>
          <div>
            <h1 data-i18n="emergencyNumbers" style="color:var(--color-error)">${t('emergencyNumbers')}</h1>
            <p class="subtitle" data-i18n="emergencyDesc">${t('emergencyDesc')}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:800px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4)">
          ${(numbers || []).map(n => {
            const name = lang === 'ne' ? (n.name?.ne || n.name?.en) : n.name?.en;
            return `
              <div class="card" style="padding:var(--space-4)">
                <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
                  <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;color:var(--color-error)">${n.icon || 'call'}</span>
                  <h3 style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${name}</h3>
                </div>
                <a href="tel:${n.number}" style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--color-primary);text-decoration:none;display:block;margin-bottom:var(--space-1)">
                  ${n.number}
                </a>
                ${n.description ? `<p style="font-size:var(--text-xs);color:var(--text-secondary)">${lang === 'ne' ? (n.description?.ne || n.description?.en) : n.description?.en}</p>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  State.addRecentPage({ id: 'emergency', title: t('emergencyNumbers'), icon: 'emergency', route: '/emergency' });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
