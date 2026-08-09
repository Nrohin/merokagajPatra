/**
 * Footer Component
 */

import { t } from '../i18n.js';
import * as State from '../state.js';

export function init() {
  render();
  State.subscribe('lang', render);
}

function render() {
  const container = document.getElementById('footer-content');
  if (!container) return;

  container.innerHTML = `
    <div class="footer-section">
      <h3>${t('footerAbout')}</h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed);margin-bottom:var(--space-3)">
        ${t('footerAboutText')}
      </p>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
        <span class="tag tag--outline">${t('footerOffline')}</span>
        <span class="tag tag--outline">${t('footerFree')}</span>
      </div>
    </div>

    <div class="footer-section">
      <h3>${t('footerQuickLinks')}</h3>
      <a href="#/services" class="footer-link">${t('nav.services')}</a>
      <a href="#/life-events" class="footer-link">${t('nav.lifeEvents')}</a>
      <a href="#/offices" class="footer-link">${t('nav.offices')}</a>
      <a href="#/departments" class="footer-link">${t('nav.departments')}</a>
      <a href="#/glossary" class="footer-link">${t('nav.glossary')}</a>
    </div>

    <div class="footer-section">
      <h3>${t('footerResources')}</h3>
      <a href="#/faq" class="footer-link">${t('nav.faq')}</a>
      <a href="#/news" class="footer-link">${t('nav.news')}</a>
      <a href="#/emergency" class="footer-link">${t('nav.emergency')}</a>
      <a href="#/bookmarks" class="footer-link">${t('nav.bookmarks')}</a>
    </div>

    <div class="footer-section">
      <h3>${t('footerGovLinks')}</h3>
      <a href="https://www.gov.np" class="footer-link" target="_blank" rel="noopener">Gov.np</a>
      <a href="https://www.mofa.gov.np" class="footer-link" target="_blank" rel="noopener">MOFA</a>
      <a href="https://www.doi.gov.np" class="footer-link" target="_blank" rel="noopener">DOI</a>
      <a href="https://www.dmv.gov.np" class="footer-link" target="_blank" rel="noopener">DOVTA</a>
      <a href="https://www.npc.gov.np" class="footer-link" target="_blank" rel="noopener">NPC</a>
    </div>
  `;
}
