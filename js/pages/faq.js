/**
 * FAQ Page
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';
import { categoryLabel } from '../utils/categories.js';

export async function render({ container }) {
  const lang = getLang();
  const faqs = await loadJSON('data/faq.json');
  const categories = [...new Set(faqs.map(f => f.category || 'general'))].sort();

  container.innerHTML = `
    <div class="page-header">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/" class="breadcrumb-link" data-i18n="nav.home">${t('nav.home')}</a>
          <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
          <span class="breadcrumb-current" aria-current="page" data-i18n="nav.faq">${t('nav.faq')}</span>
        </nav>
        <h1 data-i18n="frequentlyAsked">${t('frequentlyAsked')}</h1>
        <p class="subtitle" data-i18n="faqDesc">${t('faqDesc')}</p>
      </div>
    </div>
    <div class="section">
      <div class="container" style="max-width:800px">
        <div class="chip-group" style="margin-bottom:var(--space-6)" id="faq-filters">
          <button class="chip active" data-cat="all">${t('all')}</button>
          ${categories.map(c => `<button class="chip" data-cat="${c}">${categoryLabel(c)}</button>`).join('')}
        </div>
        <div class="accordion" id="faq-list">
          ${renderFAQItems(faqs, lang)}
        </div>
      </div>
    </div>
  `;

  bindAccordions();

  // Category filter
  document.getElementById('faq-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#faq-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    const filtered = cat === 'all' ? faqs : faqs.filter(f => f.category === cat);
    document.getElementById('faq-list').innerHTML = renderFAQItems(filtered, lang);
    // Re-bind accordion
    bindAccordions();
  });

  State.addRecentPage({ id: 'faq', title: t('nav.faq'), icon: 'help', route: '/faq' });
}

function bindAccordions() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', !expanded);
      const panel = trigger.nextElementSibling;
      if (panel) panel.classList.toggle('open', !expanded);
    });
  });
}

function renderFAQItems(faqs, lang) {
  if (faqs.length === 0) {
    return `<div class="empty-state"><p>${t('noResults')}</p></div>`;
  }
  return faqs.map(f => {
    const q = lang === 'ne' ? (f.question?.ne || f.question?.en) : f.question?.en;
    const a = lang === 'ne' ? (f.answer?.ne || f.answer?.en) : f.answer?.en;
    return `
      <div class="accordion-item">
        <button class="accordion-trigger" aria-expanded="false" aria-controls="faq-panel-${f.id}">
          <span>${q}</span>
          <span class="material-symbols-rounded" aria-hidden="true">expand_more</span>
        </button>
        <div class="accordion-panel" id="faq-panel-${f.id}" role="region">
          <p>${a}</p>
        </div>
      </div>
    `;
  }).join('');
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
