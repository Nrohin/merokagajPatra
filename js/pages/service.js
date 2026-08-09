/**
 * Service Detail Page
 * Shows full guide for a government service: steps, documents, fees, etc.
 */

import * as State from '../state.js';
import { t, getLang } from '../i18n.js';
import { formatDate, showToast, copyToClipboard } from '../utils/dom.js';
import { navigate } from '../router.js';
import { categoryLabel } from '../utils/categories.js';
import { renderDAOSelector, bindDAOSelector, init as initDAO } from '../components/dao-selector.js';

let cleanup = [];

export async function render({ params, container }) {
  const lang = getLang();
  const serviceId = params.id;

  const [services, fees, processing, forms, departments, offices] = await Promise.all([
    loadJSON('data/services.json'),
    loadJSON('data/fees.json'),
    loadJSON('data/processing.json'),
    loadJSON('data/forms.json'),
    loadJSON('data/departments.json'),
    loadJSON('data/offices.json'),
  ]);

  const service = services.find(s => s.id === serviceId);
  if (!service) {
    container.innerHTML = `<div class="container section"><div class="empty-state">
      <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
      <h3>${t('serviceNotFound')}</h3>
      <p><a href="#/services">${t('browseAllServices')}</a></p>
    </div></div>`;
    return;
  }

  const serviceFees = (fees || []).filter(f => f.serviceId === serviceId);
  const serviceProcessing = (processing || []).find(p => p.serviceId === serviceId);
  const serviceForms = (forms || []).filter(f => f.serviceId === serviceId);
  const dept = (departments || []).find(d => d.id === service.departmentId);
  const serviceOffices = (offices || []).filter(o =>
    service.offices?.includes(o.id) || o.services?.includes(serviceId)
  );

  const isBookmarked = State.isBookmarked(serviceId);
  const serviceName = lang === 'ne' ? (service.name?.ne || service.name?.en) : service.name?.en;
  const serviceDesc = lang === 'ne' ? (service.description?.ne || service.description?.en) : service.description?.en;

  container.innerHTML = `
    <!-- Breadcrumbs -->
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/" class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-separator" aria-hidden="true">
          <span class="material-symbols-rounded" style="font-size:16px">chevron_right</span>
        </span>
        <a href="#/services" class="breadcrumb-link">${t('nav.services')}</a>
        <span class="breadcrumb-separator" aria-hidden="true">
          <span class="material-symbols-rounded" style="font-size:16px">chevron_right</span>
        </span>
        <a href="#/category/${service.category || 'other'}" class="breadcrumb-link">${categoryLabel(service.category || 'other')}</a>
        <span class="breadcrumb-separator" aria-hidden="true">
          <span class="material-symbols-rounded" style="font-size:16px">chevron_right</span>
        </span>
        <span class="breadcrumb-current" aria-current="page">${serviceName}</span>
      </nav>
    </div>

    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2);flex-wrap:wrap">
              <span class="tag tag--primary">${categoryLabel(service.category || 'other')}</span>
              ${service.subCategory ? `<span class="tag tag--outline">${t('sub.' + service.subCategory)}</span>` : ''}
              ${service.popular ? `<span class="tag tag--accent">${t('popular')}</span>` : ''}
            </div>
            <h1>${serviceName}</h1>
            ${serviceDesc ? `<p class="subtitle">${serviceDesc}</p>` : ''}
          </div>
          <div style="display:flex;gap:var(--space-2);flex-shrink:0">
            <button class="btn btn--secondary btn--sm" id="bookmark-btn" aria-label="${isBookmarked ? t('removeBookmark') : t('addBookmark')}">
              <span class="material-symbols-rounded" aria-hidden="true">${isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
              <span>${isBookmarked ? t('bookmarked') : t('bookmark')}</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="share-btn" aria-label="${t('share')}">
              <span class="material-symbols-rounded" aria-hidden="true">share</span>
              <span>${t('share')}</span>
            </button>
          </div>
        </div>

        <!-- Quick Info Bar -->
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-6);margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--border-primary)">
          ${serviceProcessing ? `
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px;color:var(--text-tertiary)">schedule</span>
              <div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)" data-i18n="processingTime">${t('processingTime')}</div>
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${serviceProcessing.standardDays ? serviceProcessing.standardDays + ' ' + (lang === 'ne' ? 'दिन' : 'days') : (serviceProcessing.note ? (lang === 'ne' ? (serviceProcessing.note.ne || serviceProcessing.note.en) : serviceProcessing.note.en) : t('needsVerification'))}</div>
              </div>
            </div>
          ` : ''}
          ${serviceFees.length > 0 ? `
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px;color:var(--text-tertiary)">payments</span>
              <div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)" data-i18n="fee">${t('fee')}</div>
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${serviceFees[0].amount > 0 ? 'NPR ' + serviceFees[0].amount?.toLocaleString() : (serviceFees[0].note ? (lang === 'ne' ? (serviceFees[0].note.ne || serviceFees[0].note.en) : serviceFees[0].note.en) : t('needsVerification'))}</div>
              </div>
            </div>
          ` : ''}
          ${dept ? `
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px;color:var(--text-tertiary)">account_balance</span>
              <div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)" data-i18n="department">${t('department')}</div>
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${lang === 'ne' ? (dept.name?.ne || dept.name?.en) : dept.name?.en}</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="section">
      <div class="container" style="max-width:900px">
        <div style="display:grid;grid-template-columns:1fr;gap:var(--space-8)">

          <!-- Steps -->
          ${service.steps?.length ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">checklist</span>
                <span data-i18n="stepByStepGuide">${t('stepByStepGuide')}</span>
              </h2>
              <div class="steps">
                ${service.steps.map((step, i) => `
                  <div class="step">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-title">${lang === 'ne' ? (step.title?.ne || step.title?.en) : step.title?.en}</div>
                    <div class="step-desc">${lang === 'ne' ? (step.description?.ne || step.description?.en) : step.description?.en}</div>
                    ${step.tip ? `
                      <div class="info-box info-box--info" style="margin-top:var(--space-3)">
                        <span class="material-symbols-rounded" aria-hidden="true">lightbulb</span>
                        <span>${lang === 'ne' ? (step.tip?.ne || step.tip?.en) : step.tip?.en}</span>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Required Documents Checklist -->
          ${service.documents?.length ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">verified</span>
                <span data-i18n="requiredDocuments">${t('requiredDocuments')}</span>
              </h2>
              <div class="card">
                <div style="display:flex;justify-content:flex-end;gap:var(--space-2);margin-bottom:var(--space-3)">
                  <button class="btn btn--ghost btn--sm" id="copy-checklist">
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">content_copy</span> ${t('copyList')}
                  </button>
                  <button class="btn btn--ghost btn--sm" id="print-checklist">
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">print</span> ${t('printList')}
                  </button>
                  <button class="btn btn--ghost btn--sm" id="export-pdf">
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">picture_as_pdf</span> ${t('exportPDF')}
                  </button>
                </div>
                <ul class="checklist" id="document-checklist" role="list">
                  ${service.documents.map((doc, i) => `
                    <li class="checklist-item">
                      <input type="checkbox" class="checklist-checkbox" id="doc-${i}">
                      <label class="checklist-text" for="doc-${i}">
                        ${lang === 'ne' ? (doc.name?.ne || doc.name?.en) : doc.name?.en}
                        ${doc.required === false ? ` <span class="tag tag--outline" style="font-size:10px">${t('optional')}</span>` : ''}
                        ${doc.note ? `<br><small style="color:var(--text-tertiary)">${lang === 'ne' ? (doc.note?.ne || doc.note?.en) : doc.note?.en}</small>` : ''}
                      </label>
                    </li>
                  `).join('')}
                </ul>
                <div style="margin-top:var(--space-3);padding:var(--space-3);background:var(--color-primary-50);border-radius:var(--radius-md);font-size:var(--text-sm);color:var(--color-primary);display:flex;align-items:center;gap:var(--space-2)">
                  <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px">info</span>
                  <span>${lang === 'ne' ? 'सबै कागजातको सक्कल र प्रतिलिपि दुवै लैजानुहोस्।' : 'Carry both originals and photocopies of all documents.'}</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Fee Details -->
          ${serviceFees.length > 0 ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">payments</span>
                <span data-i18n="feeDetails">${t('feeDetails')}</span>
              </h2>
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th data-i18n="feeType">${t('feeType')}</th>
                      <th data-i18n="amount">${t('amount')}</th>
                      <th data-i18n="notes">${t('notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${serviceFees.map(f => `
                      <tr>
                        <td>${lang === 'ne' ? (f.type?.ne || f.type?.en) : f.type?.en}</td>
                        <td style="font-weight:var(--weight-semibold)">NPR ${f.amount?.toLocaleString()}</td>
                        <td style="color:var(--text-secondary);font-size:var(--text-xs)">${lang === 'ne' ? (f.note?.ne || f.note?.en || '') : (f.note?.en || '')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Processing Time -->
          ${serviceProcessing ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">schedule</span>
                <span data-i18n="processingTime">${t('processingTime')}</span>
              </h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space-4)">
                <div class="card" style="text-align:center;padding:var(--space-4)">
                  <div style="font-size:var(--text-3xl);font-weight:var(--weight-bold);color:var(--color-primary)">${serviceProcessing.standardDays}</div>
                  <div style="font-size:var(--text-sm);color:var(--text-secondary)">${t('standardDays')}</div>
                </div>
                ${serviceProcessing.expressDays ? `
                  <div class="card" style="text-align:center;padding:var(--space-4)">
                    <div style="font-size:var(--text-3xl);font-weight:var(--weight-bold);color:var(--color-accent)">${serviceProcessing.expressDays}</div>
                    <div style="font-size:var(--text-sm);color:var(--text-secondary)">${t('expressDays')}</div>
                  </div>
                ` : ''}
                ${serviceProcessing.maxDays ? `
                  <div class="card" style="text-align:center;padding:var(--space-4)">
                    <div style="font-size:var(--text-3xl);font-weight:var(--weight-bold);color:var(--text-secondary)">${serviceProcessing.maxDays}</div>
                    <div style="font-size:var(--text-sm);color:var(--text-secondary)">${t('maxDays')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Official Forms -->
          ${serviceForms.length > 0 ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">download</span>
                <span data-i18n="officialForms">${t('officialForms')}</span>
              </h2>
              <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                ${serviceForms.map(f => `
                  <div class="card" style="padding:var(--space-3) var(--space-4)">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3)">
                      <div style="display:flex;align-items:center;gap:var(--space-3)">
                        <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--text-tertiary)">description</span>
                        <div>
                          <div style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${lang === 'ne' ? (f.name?.ne || f.name?.en) : f.name?.en}</div>
                          ${f.format ? `<div style="font-size:var(--text-xs);color:var(--text-tertiary)">${f.format.toUpperCase()}</div>` : ''}
                        </div>
                      </div>
                      ${f.url ? `
                        <a href="${f.url}" class="btn btn--secondary btn--sm" target="_blank" rel="noopener" aria-label="${t('download')} ${lang === 'ne' ? (f.name?.ne || f.name?.en) : f.name?.en}">
                          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">download</span>
                          ${t('download')}
                        </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Common Mistakes -->
          ${service.commonMistakes?.length ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
                <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-warning)">warning</span>
                <span data-i18n="commonMistakes">${t('commonMistakes')}</span>
              </h2>
              <div class="info-box info-box--warning">
                <span class="material-symbols-rounded" aria-hidden="true">info</span>
                <div>
                  <ul style="list-style:disc;padding-left:var(--space-4);margin:0">
                    ${service.commonMistakes.map(m => `
                      <li style="margin-bottom:var(--space-2)">${lang === 'ne' ? (m?.ne || m?.en) : m?.en}</li>
                    `).join('')}
                  </ul>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Where to Apply -->
          <div>
            <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
              <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--color-primary)">location_on</span>
              <span>${service.id === 'citizenship-by-birth' ? (lang === 'ne' ? 'कहाँ परामर्श लिने' : 'Where to Consult') : t('whereToApply')}</span>
            </h2>

            <!-- DAO Selector for citizenship/NID/passport -->
            ${['citizenship-by-descent','citizenship-by-birth','citizenship-naturalized','citizenship-nrn','citizenship-honorary','citizenship-duplicate','naturalized-marriage','naturalized-child','naturalized-parents-child','national-id','passport','passport-replacement'].includes(service.id) ? `
              <div id="dao-selector-container"></div>
            ` : ''}

            <!-- Office list for other services -->
            ${!['citizenship-by-descent','citizenship-by-birth','citizenship-naturalized','citizenship-nrn','citizenship-honorary','citizenship-duplicate','naturalized-marriage','naturalized-child','naturalized-parents-child','national-id','passport','passport-replacement'].includes(service.id) && serviceOffices.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                ${serviceOffices.slice(0, 5).map(office => `
                  <div class="card" style="padding:var(--space-4)">
                    <div style="display:flex;align-items:flex-start;gap:var(--space-3)">
                      <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--text-tertiary);margin-top:2px">apartment</span>
                      <div style="flex:1">
                        <div style="font-weight:var(--weight-semibold);margin-bottom:var(--space-1)">${lang === 'ne' ? (office.name?.ne || office.name?.en) : office.name?.en}</div>
                        <div style="font-size:var(--text-sm);color:var(--text-secondary)">${lang === 'ne' ? (office.address?.ne || office.address?.en || '') : (office.address?.en || '')}</div>
                        ${office.phone ? `<div style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:var(--space-1)"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">call</span> ${office.phone}</div>` : ''}
                      </div>
                      ${office.mapUrl ? `
                        <a href="${office.mapUrl}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener" aria-label="${t('viewOnMap')}">
                          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px">map</span>
                          ${t('map')}
                        </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Related Services -->
          ${service.relatedServices?.length ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)" data-i18n="relatedServices">${t('relatedServices')}</h2>
              <div class="grid grid-2" style="gap:var(--space-3)">
                ${service.relatedServices.map(relId => {
                  const relService = services.find(s => s.id === relId);
                  if (!relService) return '';
                  const relName = lang === 'ne' ? (relService.name?.ne || relService.name?.en) : relService.name?.en;
                  return `
                    <a href="#/service/${relId}" class="card card--link" style="padding:var(--space-3) var(--space-4)">
                      <div style="display:flex;align-items:center;gap:var(--space-3)">
                        <span class="material-symbols-rounded" aria-hidden="true" style="color:var(--text-tertiary)">${relService.icon || 'description'}</span>
                        <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${relName}</span>
                      </div>
                    </a>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Official References -->
          ${service.officialSources?.length ? `
            <div>
              <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">${t('officialReferences')}</h2>
              <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                ${service.officialSources.map(src => `
                  <a href="${src.url}" target="_blank" rel="noopener" class="card card--link" style="padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px;color:var(--color-primary)">open_in_new</span>
                    <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${typeof src.name === 'object' ? (lang === 'ne' ? (src.name.ne || src.name.en) : src.name.en) : src.name}</span>
                    <span class="material-symbols-rounded" aria-hidden="true" style="font-size:16px;color:var(--text-tertiary);margin-left:auto">arrow_forward</span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Info Box: Disclaimer -->
          <div class="info-box info-box--info">
            <span class="material-symbols-rounded" aria-hidden="true">info</span>
            <div data-i18n="serviceDisclaimer">
              ${t('serviceDisclaimer')}
            </div>
          </div>

          <!-- Last Updated -->
          ${service.lastUpdated ? `
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);display:flex;align-items:center;gap:var(--space-2)">
              <span class="material-symbols-rounded" aria-hidden="true" style="font-size:14px">update</span>
              <span data-i18n="lastUpdated">${t('lastUpdated')}: ${formatDate(service.lastUpdated, lang)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Bind interactive features
  bindChecklistInteractions(service, serviceName, lang);
  bindBookmarkButton(serviceId);
  bindShareButton(serviceId, serviceName);

  // DAO selector for citizenship/NID/passport
  if (document.getElementById('dao-selector-container')) {
    initDAO().then(() => {
      const el = document.getElementById('dao-selector-container');
      if (el) { el.innerHTML = renderDAOSelector(); bindDAOSelector(); }
    });
  }

  // Track page visit
  State.addRecentPage({
    id: serviceId,
    title: serviceName,
    icon: service.icon || 'description',
    route: `/service/${serviceId}`,
  });

  return () => { cleanup.forEach(fn => fn()); cleanup = []; };
}

function bindChecklistInteractions(service, serviceName, lang) {
  // Checkbox toggle styling
  document.querySelectorAll('.checklist-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.nextElementSibling;
      if (label) label.classList.toggle('checked', cb.checked);
    });
  });

  // Copy checklist
  const copyBtn = document.getElementById('copy-checklist');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const docs = service.documents.map(d => {
        const name = lang === 'ne' ? (d.name?.ne || d.name?.en) : d.name?.en;
        return d.required === false ? `${name} (${t('optional')})` : name;
      });
      const text = `${serviceName}\n${t('requiredDocuments')}:\n${docs.map(d => `• ${d}`).join('\n')}`;
      const ok = await copyToClipboard(text);
      showToast(ok ? t('copiedToClipboard') : t('copyFailed'), ok ? 'success' : 'error');
    });
  }

  // Print checklist
  const printBtn = document.getElementById('print-checklist');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const checklist = document.getElementById('document-checklist');
      if (!checklist) return;
      const win = window.open('', '_blank');
      win.document.write(`
        <html><head><title>${serviceName} - ${t('requiredDocuments')}</title>
        <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:600px;margin:0 auto}
        h1{font-size:1.5rem;margin-bottom:1rem}li{padding:0.5rem 0;border-bottom:1px solid #eee}
        .optional{color:#888;font-size:0.8em}</style></head>
        <body><h1>${serviceName}</h1><h2>${t('requiredDocuments')}</h2>
        <ul>${service.documents.map(d => {
          const name = lang === 'ne' ? (d.name?.ne || d.name?.en) : d.name?.en;
          return `<li>${name}${d.required === false ? ` <span class="optional">${t('optional')}</span>` : ''}</li>`;
        }).join('')}</ul></body></html>
      `);
      win.document.close();
      win.print();
    });
  }
}

function bindBookmarkButton(serviceId) {
  const btn = document.getElementById('bookmark-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const isNow = State.isBookmarked(serviceId);
    if (isNow) {
      State.removeBookmark(serviceId);
      btn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">bookmark_border</span><span>${t('bookmark')}</span>`;
      showToast(t('bookmarkRemoved'), 'info');
    } else {
      State.addBookmark(serviceId);
      btn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">bookmark</span><span>${t('bookmarked')}</span>`;
      showToast(t('bookmarkAdded'), 'success');
    }
  });
}

function bindShareButton(serviceId, serviceName) {
  const btn = document.getElementById('share-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}#/service/${serviceId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: serviceName, url });
      } catch { /* user cancelled */ }
    } else {
      const ok = await copyToClipboard(url);
      showToast(ok ? t('linkCopied') : t('copyFailed'), ok ? 'success' : 'error');
    }
  });
}

async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}
