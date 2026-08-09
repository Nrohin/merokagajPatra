/**
 * News Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

function formatDateLocal(dateStr, lang) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

export async function render({ container }) {
  const lang = getLang();
  const news = await loadJSON('data/news.json');

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.news">${t('nav.news')}</span>
        </nav>
        <h1 data-i18n="latestNews">${t('latestNews')}</h1>
        <p class="subtitle" data-i18n="newsDesc">${t('newsDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:800px">
        ${(news || []).length === 0 ? `
          <div class="empty-state"><span class="material-symbols-rounded" aria-hidden="true">newspaper</span><h3>${t('noNewsYet')}</h3></div>
        ` : (news || []).map(n => {
          const title = lang === 'ne' ? (n.title?.ne || n.title?.en) : n.title?.en;
          const summary = lang === 'ne' ? (n.summary?.ne || n.summary?.en) : n.summary?.en;
          const body = lang === 'ne' ? (n.body?.ne || n.body?.en) : n.body?.en;
          return `
            <article class="card" style="padding:var(--space-6);margin-bottom:var(--space-4)">
              <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2)">
                <span class="tag tag--primary">${n.category || t('update')}</span>
                <time style="font-size:var(--text-xs);color:var(--text-tertiary)">${formatDateLocal(n.date, lang)}</time>
              </div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-2)">${title}</h2>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed);margin-bottom:var(--space-3)">${summary}</p>
              ${body ? `<p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed)">${body}</p>` : ''}
              ${n.source ? `<a href="${n.source}" target="_blank" rel="noopener" style="font-size:var(--text-xs);color:var(--text-link);margin-top:var(--space-3);display:inline-flex;align-items:center;gap:var(--space-1)"><span class="material-symbols-rounded" style="font-size:14px">open_in_new</span> ${t('source')}</a>` : ''}
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  State.addRecentPage({ id: 'news', title: t('nav.news'), icon: 'newspaper', route: '/news' });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
