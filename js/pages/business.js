/**
 * Business & Trade Overview Page
 * Shows sub-categories and services grouped by type, with search.
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';
import { createSearchBar, attachSearchListeners } from '../components/search-bar.js';

const SUB_CATEGORIES = [
  { id: 'local-registration', name: { en: 'Business Registration & Licensing', ne: 'व्यवसाय दर्ता र इजाजतपत्र' }, icon: 'storefront', office: { en: 'Ward Office / Municipality', ne: 'वडा कार्यालय / नगरपालिका' }, desc: { en: 'Register, renew, modify, or close your business at the local level.', ne: 'स्थानीय तहमा व्यवसाय दर्ता, नवीकरण, संशोधन वा बन्द गर्नुहोस्।' } },
  { id: 'tax', name: { en: 'Tax Registration', ne: 'कर दर्ता' }, icon: 'calculate', office: { en: 'Inland Revenue Department', ne: 'आन्तरिक राजस्व विभाग' }, desc: { en: 'PAN, VAT, tax clearance, and excise registration.', ne: 'PAN, VAT, कर चुक्ता, र अन्तःशुल्क दर्ता।' } },
  { id: 'company', name: { en: 'Company Services', ne: 'कम्पनी सेवाहरू' }, icon: 'corporate_fare', office: { en: 'Office of the Company Registrar', ne: 'कम्पनी दर्ता कार्यालय' }, desc: { en: 'Register, manage, modify, or dissolve a company.', ne: 'कम्पनी दर्ता, व्यवस्थापन, संशोधन वा खारेजी गर्नुहोस्।' } },
  { id: 'partnership', name: { en: 'Partnership & Firms', ne: 'साझेदारी फर्म' }, icon: 'groups', office: { en: 'Office of the Company Registrar', ne: 'कम्पनी दर्ता कार्यालय' }, desc: { en: 'Register, amend, or dissolve a partnership firm.', ne: 'साझेदारी फर्म दर्ता, संशोधन वा खारेजी गर्नुहोस्।' } },
  { id: 'industry', name: { en: 'Industry Registration', ne: 'उद्योग दर्ता' }, icon: 'factory', office: { en: 'Department of Industry', ne: 'उद्योग विभाग' }, desc: { en: 'Register cottage, small, medium, or large industries.', ne: 'घरेलु, साना, मझौला वा ठूला उद्योग दर्ता गर्नुहोस्।' } },
  { id: 'foreign-trade', name: { en: 'Foreign Trade', ne: 'भन्सार तथा वाणिज्य' }, icon: 'import_export', office: { en: 'Department of Customs', ne: 'भन्सार विभाग' }, desc: { en: 'Import-Export Code (EXIM) registration.', ne: 'आयात-निर्यात कोड (EXIM) दर्ता।' } },
  { id: 'commerce', name: { en: 'Commerce Certificates', ne: 'वाणिज्य प्रमाणपत्र' }, icon: 'verified', office: { en: 'Commerce Authority', ne: 'वाणिज्य प्राधिकरण' }, desc: { en: 'Certificate of origin, export/import recommendations.', ne: 'उत्पत्ति प्रमाणपत्र, निर्यात/आयात सिफारिस।' } },
];

export async function render({ container }) {
  const lang = getLang();
  const services = await loadJSON('data/services.json');
  const bizServices = services.filter(s => s.category === 'business');

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/category/business" class="breadcrumb-link">${t('cat.business')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${t('nav.services')}</span>
      </nav>
    </div>

    <div class="page-header">
      <div class="container">
        <h1>${lang === 'ne' ? 'व्यापार तथा वाणिज्य' : 'Business & Trade'}</h1>
        <p class="subtitle">${lang === 'ne' ? 'व्यवसाय दर्ता, कर, कम्पनी, साझेदारी, उद्योग, र वाणिज्य सम्बन्धी सरकारी सेवाहरू।' : 'Government services for business registration, tax, companies, partnerships, industry, and commerce.'}</p>
        <div style="margin-top:var(--space-4)">
          <span class="tag tag--primary">${bizServices.length} ${lang === 'ne' ? 'सेवाहरू' : 'services'}</span>
          <span class="tag tag--outline" style="margin-left:var(--space-2)">${SUB_CATEGORIES.length} ${lang === 'ne' ? 'श्रेणी' : 'categories'}</span>
        </div>
      </div>
    </div>

    <section class="section--sm">
      <div class="container">${createSearchBar({ id: 'business-search', placeholder: 'searchPlaceholder' })}</div>
    </section>

    <section class="section">
      <div class="container">
        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-6)">${lang === 'ne' ? 'सेवा श्रेणीहरू' : 'Service Categories'}</h2>
        <div id="business-subcategories">${renderSubCats(bizServices, lang)}</div>
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

  State.addRecentPage({ id: 'business-overview', title: lang === 'ne' ? 'व्यापार' : 'Business', icon: 'business', route: '/business' });

  // Search
  attachSearchListeners('business-search');
  const searchInput = document.getElementById('business-search');
  const subCatContainer = document.getElementById('business-subcategories');

  if (searchInput && subCatContainer) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        subCatContainer.innerHTML = renderSubCats(bizServices, lang);
        return;
      }
      const matched = bizServices.filter(s => {
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
