/**
 * Citizenship Overview Page
 * Shows all 5 citizenship types with comparison and cards.
 */

import { t, getLang } from '../i18n.js';
import * as State from '../state.js';

export async function render({ container }) {
  const lang = getLang();
  const services = await loadJSON('data/services.json');
  const citizenshipServices = services.filter(s => s.id.startsWith('citizenship-') || s.subCategory);

  const legalBases = {
    'citizenship-by-descent':  { en: 'Constitution Art. 11(2), 12', ne: 'संविधान धारा ११(२), १२' },
    'citizenship-by-birth':    { en: 'Constitution Art. 11', ne: 'संविधान धारा ११' },
    'citizenship-naturalized': { en: 'Constitution Art. 11', ne: 'संविधान धारा ११' },
    'citizenship-nrn':         { en: 'Constitution Art. 14', ne: 'संविधान धारा १४' },
    'citizenship-honorary':    { en: 'Constitution Art. 11(9)', ne: 'संविधान धारा ११(९)' },
  };

  const officeInfo = {
    'citizenship-by-descent':  { en: 'DAO', ne: 'जिल्ला प्रशासनिक कार्यालय' },
    'citizenship-by-birth':    { en: 'DAO', ne: 'जिल्ला प्रशासनिक कार्यालय' },
    'citizenship-naturalized': { en: 'DAO / MoHA', ne: 'जिल्ला प्रशासनिक कार्यालय / गृह मन्त्रालय' },
    'citizenship-nrn':         { en: 'Competent Authority / DAO', ne: 'सक्षम निकाय / जिल्ला प्रशासनिक कार्यालय' },
    'citizenship-honorary':    { en: 'Government of Nepal', ne: 'नेपाल सरकार' },
  };

  const icons = {
    'citizenship-by-descent':  'badge',
    'citizenship-by-birth':    'child_care',
    'citizenship-naturalized': 'badge',
    'citizenship-nrn':         'flight',
    'citizenship-honorary':    'military_tech',
  };

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <a href="#/category/civil" class="breadcrumb-link">${t('cat.civil')}</a>
        <span class="breadcrumb-separator" aria-hidden="true"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>
        <span class="breadcrumb-current" aria-current="page">${t('nav.services')}</span>
      </nav>
    </div>

    <div class="page-header">
      <div class="container">
        <h1>${lang === 'ne' ? 'नेपाली नागरिकताका प्रकारहरू' : 'Types of Nepali Citizenship'}</h1>
        <p class="subtitle">${lang === 'ne'
          ? 'नेपाल संविधान र नागरिकता ऐन, २०६३ अन्तर्गत पाँच प्रमुख नागरिकता श्रेणीहरू।'
          : 'Five main categories of Nepali citizenship under the Constitution and Citizenship Act, 2063.'
        }</p>
      </div>
    </div>

    <!-- Legal Sources -->
    <section class="section--sm" style="background:var(--bg-secondary);padding:var(--space-4) 0">
      <div class="container">
        <div class="info-box info-box--info" style="margin:0">
          <span class="material-symbols-rounded" aria-hidden="true">gavel</span>
          <div>
            <strong>${lang === 'ne' ? 'कानुनी स्रोतहरू:' : 'Legal Sources:'}</strong>
            ${lang === 'ne'
              ? 'नेपाल संविधान, २०७२ (धारा १०-१५), नेपाल नागरिकता ऐन, २०६३, नेपाल नागरिकता नियमावली, २०६३'
              : 'Constitution of Nepal, 2072 (Articles 10–15), Nepal Citizenship Act, 2063, Nepal Citizenship Rules, 2063'
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Table -->
    <section class="section">
      <div class="container">
        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">
          ${lang === 'ne' ? 'तुलनात्मक तालिका' : 'Comparison Table'}
        </h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>${lang === 'ne' ? 'नागरिकताको प्रकार' : 'Citizenship Type'}</th>
                <th>${lang === 'ne' ? 'कानुनी आधार' : 'Legal Basis'}</th>
                <th>${lang === 'ne' ? 'मुख्य कार्यालय' : 'Primary Office'}</th>
              </tr>
            </thead>
            <tbody>
              ${citizenshipServices.map(s => {
                const name = lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en;
                const legal = legalBases[s.id];
                const office = officeInfo[s.id];
                return `
                  <tr style="cursor:pointer" onclick="location.hash='#/service/${s.id}'">
                    <td style="font-weight:var(--weight-semibold)">
                      <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px;vertical-align:middle;margin-right:var(--space-1);color:var(--color-primary)">${icons[s.id]}</span>
                      ${name}
                    </td>
                    <td>${legal ? (lang === 'ne' ? legal.ne : legal.en) : ''}</td>
                    <td>${office ? (lang === 'ne' ? office.ne : office.en) : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Service Cards -->
    <section class="section section--bg">
      <div class="container">
        <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-6)">
          ${lang === 'ne' ? 'विस्तृत मार्गदर्शन' : 'Detailed Guides'}
        </h2>
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          ${citizenshipServices.map(s => {
            const name = lang === 'ne' ? (s.name?.ne || s.name?.en) : s.name?.en;
            const desc = lang === 'ne' ? (s.description?.ne || s.description?.en) : s.description?.en;
            const stepsCount = s.steps?.length || 0;
            const docsCount = s.documents?.length || 0;
            return `
              <a href="#/service/${s.id}" class="card card--link card--accent" style="display:flex;gap:var(--space-5);align-items:flex-start">
                <div class="card-icon" style="flex-shrink:0">
                  <span class="material-symbols-rounded" aria-hidden="true">${icons[s.id]}</span>
                </div>
                <div style="flex:1">
                  <h3 class="card-title" style="margin-bottom:var(--space-1)">${name}</h3>
                  ${s.id === 'citizenship-honorary' ? `<span class="tag tag--outline" style="margin-bottom:var(--space-2);display:inline-block">${lang === 'ne' ? 'अंगीकृत' : 'Naturalized'}</span>` : ''}
                  <p class="card-desc" style="margin-bottom:var(--space-3)">${desc}</p>
                  <div class="card-meta">
                    <span class="card-meta-item">
                      <span class="material-symbols-rounded" aria-hidden="true">checklist</span>
                      ${stepsCount} ${lang === 'ne' ? 'चरण' : 'steps'}
                    </span>
                    <span class="card-meta-item">
                      <span class="material-symbols-rounded" aria-hidden="true">description</span>
                      ${docsCount} ${lang === 'ne' ? 'कागजात' : 'documents'}
                    </span>
                    <span class="card-meta-item">
                      <span class="material-symbols-rounded" aria-hidden="true">schedule</span>
                      ${s.processing?.standardDays ? `${s.processing.standardDays} ${lang === 'ne' ? 'दिन' : 'days'}` : (lang === 'ne' ? 'निर्भर' : 'Varies')}
                    </span>
                  </div>
                </div>
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--text-tertiary);flex-shrink:0">arrow_forward</span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Important Notes -->
    <section class="section">
      <div class="container" style="max-width:800px">
        <div class="info-box info-box--warning" style="margin-bottom:var(--space-4)">
          <span class="material-symbols-rounded" aria-hidden="true">warning</span>
          <div>
            <strong>${lang === 'ne' ? 'महत्त्वपूर्ण:' : 'Important:'}</strong>
            ${lang === 'ne'
              ? 'नेपालमा जन्म मात्रबाट नागरिकता दिइँदैन। जन्मको आधारमा नागरिकता विशिष्ट संवैधानिक व्यवस्थामा निर्भर छ।'
              : 'Being born in Nepal does not automatically grant citizenship. Citizenship by Birth depends on specific constitutional provisions.'
            }
          </div>
        </div>
        <div class="info-box info-box--info">
          <span class="material-symbols-rounded" aria-hidden="true">info</span>
          <div>
            ${t('serviceDisclaimer')}
          </div>
        </div>
      </div>
    </section>
  `;

  State.addRecentPage({
    id: 'citizenship-overview',
    title: lang === 'ne' ? 'नागरिकता' : 'Citizenship',
    icon: 'badge',
    route: '/citizenship',
  });
}

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch { return []; }
}
