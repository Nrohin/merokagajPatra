/**
 * Header Component
 * Navigation, logo, action buttons.
 */

import * as State from '../state.js';
import { t } from '../i18n.js';
import { $, $$ } from '../utils/dom.js';

const NAV_ITEMS = [
  { key: 'home', label: 'nav.home', icon: 'home', route: '#/' },
  { key: 'services', label: 'nav.services', icon: 'description', route: '#/services' },
  { key: 'lifeEvents', label: 'nav.lifeEvents', icon: 'celebration', route: '#/life-events' },
  { key: 'offices', label: 'nav.offices', icon: 'location_on', route: '#/offices' },
  { key: 'faq', label: 'nav.faq', icon: 'help', route: '#/faq' },
];

export function init() {
  renderNav();
  renderMobileNav();
  bindEvents();

  State.subscribe('lang', () => {
    renderNav();
    renderMobileNav();
  });
}

function renderNav() {
  const nav = $('#main-nav');
  if (!nav) return;

  const currentPath = window.location.hash || '#/';

  nav.innerHTML = NAV_ITEMS.map(item => `
    <a href="${item.route}" class="nav-link ${currentPath === item.route ? 'active' : ''}"
       data-i18n="${item.label}">
      ${t(item.label)}
    </a>
  `).join('');
}

function renderMobileNav() {
  const mobileNav = $('#mobile-nav');
  if (!mobileNav) return;

  mobileNav.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:var(--space-4);border-bottom:1px solid var(--border-primary);margin-bottom:var(--space-4)">
      <span style="font-family:var(--font-display);font-weight:var(--weight-bold);font-size:var(--text-lg)">${t('menu')}</span>
      <button class="icon-btn" id="menu-close" aria-label="${t('close')}">
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
      </button>
    </div>
    ${NAV_ITEMS.map(item => `
      <a href="${item.route}" class="mobile-nav-link" data-i18n="${item.label}">
        ${t(item.label)}
      </a>
    `).join('')}
    <div style="margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--border-primary)">
      <a href="#/glossary" class="mobile-nav-link" data-i18n="nav.glossary">
        ${t('nav.glossary')}
      </a>
      <a href="#/emergency" class="mobile-nav-link" data-i18n="nav.emergency">
        ${t('nav.emergency')}
      </a>
      <a href="#/news" class="mobile-nav-link" data-i18n="nav.news">
        ${t('nav.news')}
      </a>
      <a href="#/bookmarks" class="mobile-nav-link" data-i18n="nav.bookmarks">
        ${t('nav.bookmarks')}
      </a>
    </div>
  `;

  const closeBtn = mobileNav.querySelector('#menu-close');
  if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
}

function bindEvents() {
  const menuBtn = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  // Close mobile menu on link click
  document.addEventListener('click', (e) => {
    if (e.target.closest('.mobile-nav-link')) {
      closeMobileMenu();
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // Update active nav on hash change
  window.addEventListener('hashchange', () => {
    renderNav();
  });
}

function openMobileMenu() {
  const btn = $('#menu-toggle');
  const nav = $('#mobile-nav');
  if (btn) {
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('.material-symbols-rounded').textContent = 'close';
  }
  if (nav) nav.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const btn = $('#menu-toggle');
  const nav = $('#mobile-nav');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('.material-symbols-rounded').textContent = 'menu';
  }
  if (nav) nav.classList.remove('open');
  document.body.style.overflow = '';
}
