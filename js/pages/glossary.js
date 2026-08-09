/**
 * Glossary Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ container }) {
  const lang = getLang();
  const terms = await loadJSON('data/glossary.json');

  // Group by first letter
  const grouped = {};
  terms.forEach(g => {
    const term = lang === 'ne' ? (g.term?.ne || g.term?.en) : g.term?.en;
    const letter = (term || 'A').charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(g);
  });

  const letters = Object.keys(grouped).sort();

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="glossary">${t('glossary')}</span>
        </nav>
        <h1 data-i18n="governmentGlossary">${t('governmentGlossary')}</h1>
        <p class="subtitle" data-i18n="glossaryDesc">${t('glossaryDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:800px">
        <!-- Letter nav -->
        <div class="chip-group" style="margin-bottom:var(--space-6);justify-content:center">
          ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
            const hasItems = grouped[letter];
            return `<a href="#glossary-${letter}" class="chip ${hasItems ? '' : 'chip--disabled'}" style="${hasItems ? '' : 'opacity:0.3;pointer-events:none'}" aria-label="Jump to ${letter}">${letter}</a>`;
          }).join('')}
        </div>
        <!-- Terms -->
        ${letters.map(letter => `
          <div id="glossary-${letter}" style="margin-bottom:var(--space-8)">
            <h2 style="font-size:var(--text-3xl);color:var(--color-primary);margin-bottom:var(--space-4);font-family:var(--font-display)">${letter}</h2>
            <div style="display:flex;flex-direction:column;gap:var(--space-4)">
              ${grouped[letter].map(g => {
                const term = lang === 'ne' ? (g.term?.ne || g.term?.en) : g.term?.en;
                const def = lang === 'ne' ? (g.definition?.ne || g.definition?.en) : g.definition?.en;
                const termNe = g.term?.ne || '';
                return `
                  <div class="card" style="padding:var(--space-4)" id="glossary-${g.id}">
                    <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);margin-bottom:var(--space-1)">${term}</h3>
                    ${lang === 'en' && termNe ? `<p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-2)">${termNe}</p>` : ''}
                    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed)">${def}</p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  State.addRecentPage({ id: 'glossary', title: t('glossary'), icon: 'menu_book', route: '/glossary' });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
