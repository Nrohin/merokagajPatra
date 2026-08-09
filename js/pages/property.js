/**
 * Property & Land Overview Page
 * Shows sub-categories and services grouped by type, with search.
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';
import { createSearchBar, attachSearchListeners } from '../components/search-bar.js';

const SUB_CATEGORIES = [
  { id: 'land-registration', name: { en: 'Land Registration', ne: 'जग्गा दर्ता' }, icon: 'add_location', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Register new land, obtain ownership certificates, and update records.', ne: 'नयाँ जग्गा दर्ता, स्वामित्व प्रमाणपत्र, र रेकर्ड अद्यावधिक।' } },
  { id: 'ownership-transfer', name: { en: 'Land Ownership Transfer', ne: 'जग्गा नामसारी / हस्तान्तरण' }, icon: 'swap_horiz', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Transfer land by sale, inheritance, or gift.', ne: 'किनबेच, हक नामसारी, वा बकसपत्रमार्फत जग्गा हस्तान्तरण।' } },
  { id: 'partition', name: { en: 'Land Partition', ne: 'जग्गा अंशबण्डा' }, icon: 'call_split', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Divide family property and create separate ownership.', ne: 'पारिवारिक सम्पत्ति विभाजन र छुट्टा स्वामित्व सिर्जना।' } },
  { id: 'survey-map', name: { en: 'Land Survey & Map Services', ne: 'नापी तथा नक्सा सेवा' }, icon: 'map', office: { en: 'Survey Department / LRO', ne: 'नापी विभाग / भूमि राजस्व कार्यालय' }, desc: { en: 'Request maps, verify plot numbers, measure boundaries.', ne: 'नक्सा अनुरोध, कित्ता प्रमाणीकरण, सीमा नापी।' } },
  { id: 'mortgage', name: { en: 'Land Mortgage & Release', ne: 'जग्गा रोक्का तथा फुकुवा' }, icon: 'account_balance', office: { en: 'Land Revenue Office / Bank', ne: 'भूमि राजस्व कार्यालय / बैंक' }, desc: { en: 'Register bank mortgage or release land from mortgage.', ne: 'बैंक रोक्का दर्ता वा जग्गा रोक्काबाट मुक्त गर्नुहोस्।' } },
  { id: 'record-correction', name: { en: 'Land Record Correction', ne: 'जग्गा विवरण सच्याउने' }, icon: 'edit', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Correct owner names, area, and other details in land records.', ne: 'जग्गा रेकर्डमा मालिक नाम, क्षेत्रफल, र अन्य विवरण सच्याउने।' } },
  { id: 'tax', name: { en: 'Land Tax & Property Tax', ne: 'जग्गा/सम्पत्ति कर' }, icon: 'payments', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Pay property tax and obtain tax clearance.', ne: 'सम्पत्ति कर तिर्नुहोस् र कर चुक्ता प्राप्त गर्नुहोस्।' } },
  { id: 'document-verification', name: { en: 'Land Document Verification', ne: 'जग्गा कागजात प्रमाणीकरण' }, icon: 'verified', office: { en: 'Land Revenue Office', ne: 'भूमि राजस्व कार्यालय' }, desc: { en: 'Verify ownership and get certified copies of documents.', ne: 'स्वामित्व प्रमाणीकरण र प्रमाणित प्रति प्राप्त गर्नुहोस्।' } },
];

export async function render({ container }) {
  const lang = getLang();
  const services = await loadJSON('data/services.json');
  const propServices = services.filter(s => s.category === 'property');

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/category/property" class="breadcrumb-link">${t('cat.property')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${t('nav.services')}</span>
      </nav>
    </div>

    <div class="page-header">
      <div class="container">
        <h1>${lang === 'ne' ? 'सम्पत्ति तथा जग्गा' : 'Property & Land'}</h1>
        <p class="subtitle">${lang === 'ne' ? 'जग्गा दर्ता, नामसारी, नापी, रोक्का, कर, र अन्य सम्पत्ति सम्बन्धी सरकारी सेवाहरू।' : 'Government services for land registration, transfer, survey, mortgage, tax, and other property matters.'}</p>
        <div style="margin-top:var(--space-4)">
          <span class="tag tag--primary">${propServices.length} ${lang === 'ne' ? 'सेवाहरू' : 'services'}</span>
          <span class="tag tag--outline" style="margin-left:var(--space-2)">${SUB_CATEGORIES.length} ${lang === 'ne' ? 'श्रेणी' : 'categories'}</span>
        </div>
      </div>
    </div>

    <section class="section--sm">
      <div class="container">${createSearchBar({ id: 'property-search', placeholder: 'searchPlaceholder' })}</div>
    </section>

    <section class="section">
      <div class="container">
        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-6)">${lang === 'ne' ? 'सेवा श्रेणीहरू' : 'Service Categories'}</h2>
        <div id="property-subcategories">${renderSubCats(propServices, lang)}</div>
      </div>
    </section>

    <section class="section section--sm">
      <div class="container" style="max-width:800px">
        <div class="info-box info-box--info">
          <span class="material-symbols-rounded" aria-hidden="true">info</span>
          <div>${t('serviceDisclaimer')}</div>
        </div>
      </div>
    </section>
  `;

  State.addRecentPage({ id: 'property-overview', title: lang === 'ne' ? 'सम्पत्ति' : 'Property', icon: 'home', route: '/property' });

  // Search
  attachSearchListeners('property-search');
  const searchInput = document.getElementById('property-search');
  const subCatContainer = document.getElementById('property-subcategories');

  if (searchInput && subCatContainer) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        subCatContainer.innerHTML = renderSubCats(propServices, lang);
        return;
      }
      const matched = propServices.filter(s => {
        const name = ((s.name?.en || '') + ' ' + (s.name?.ne || '')).toLowerCase();
        const desc = ((s.description?.en || '') + ' ' + (s.description?.ne || '')).toLowerCase();
        const kw = (s.keywords || []).join(' ').toLowerCase();
        const sub = (s.subCategory || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || kw.includes(query) || sub.includes(query);
      });
      subCatContainer.innerHTML = matched.length ? renderSubCats(matched, lang) : `<div class="empty-state"><span class="material-symbols-rounded" aria-hidden="true">search_off</span><h3>${t('noServicesFound')}</h3></div>`;
    });
  }
}

function renderSubCats(allServices, lang) {
  return SUB_CATEGORIES.map(sub => {
    const subServices = allServices.filter(s => s.subCategory === sub.id);
    if (subServices.length === 0) return '';
    const name = lang === 'ne' ? (sub.name.ne || sub.name.en) : sub.name.en;
    const desc = lang === 'ne' ? (sub.desc.ne || sub.desc.en) : sub.desc.en;
    const office = lang === 'ne' ? (sub.office.ne || sub.office.en) : sub.office.en;
    const serviceItems = subServices.map(s => {
      const sName = lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en;
      return `
        <a href="#/service/${s.id}" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--border-primary);text-decoration:none;color:inherit;font-size:var(--text-sm)">
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px;color:var(--text-tertiary)">${s.icon || 'description'}</span>
          <span style="flex:1;font-weight:var(--weight-medium)">${sName}</span>
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px;color:var(--text-tertiary)">arrow_forward</span>
        </a>`;
    }).join('');

    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:var(--space-5);border-bottom:1px solid var(--border-primary);background:var(--bg-secondary)">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
            <span class="material-symbols-rounded" aria-hidden="true" style="font-size:28px;color:var(--color-primary)">${sub.icon}</span>
            <div>
              <h3 style="font-size:var(--text-lg);font-weight:var(--weight-semibold)">${name}</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px">
                <span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle">apartment</span> ${office}
              </p>
            </div>
            <span class="tag tag--primary" style="margin-left:auto">${subServices.length}</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary)">${desc}</p>
        </div>
        <div style="padding:var(--space-3) var(--space-5)">${serviceItems}</div>
      </div>`;
  }).join('');
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
