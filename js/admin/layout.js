
import * as Store from './store.js';
import { signOut } from './auth.js';
import { esc } from './ui.js';
import { CONFIG } from '../config.js';

const ADMIN_PATH = CONFIG.ADMIN_PATH;
const navigate = (path) => { window.location.hash = '#/' + path; };

export const NAV_SECTIONS = [
  { heading: 'Dashboard', items: [
    { label: 'Overview', icon: 'dashboard', route: '' },
  ]},
  { heading: 'Content', items: [
    { label: 'Services', icon: 'description', route: 'services' },
    { label: 'Departments', icon: 'account_balance', route: 'departments' },
    { label: 'Offices', icon: 'location_on', route: 'offices' },
    { label: 'District Offices', icon: 'domain', route: 'dao-offices' },
    { label: 'Forms', icon: 'description', route: 'forms' },
    { label: 'Fees', icon: 'payments', route: 'fees' },
    { label: 'Processing Times', icon: 'schedule', route: 'processing' },
    { label: 'FAQs', icon: 'help', route: 'faqs' },
    { label: 'Glossary', icon: 'menu_book', route: 'glossary' },
    { label: 'Emergency', icon: 'emergency', route: 'emergency' },
    { label: 'News', icon: 'newspaper', route: 'news' },
    { label: 'Life Events', icon: 'celebration', route: 'life-events' },
  ]},
  { heading: 'System', items: [
    { label: 'Translations', icon: 'translate', route: 'translations' },
    { label: 'Administrators', icon: 'group', route: 'administrators', perm: 'manage-admins' },
    { label: 'Audit Log', icon: 'history', route: 'audit-log', perm: 'view-audit' },
    { label: 'Settings', icon: 'settings', route: 'settings', perm: 'settings' },
  ]},
];

export function renderShell(container, activeRoute) {
  const profile = Store.getProfile();
  container.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar-header">
          <img src="assets/icons/logo.png" alt="" style="height:32px;border-radius:var(--radius-sm)">
          <span class="admin-sidebar-brand">MeroKagaj CMS</span>
          <button class="admin-icon-btn admin-sidebar-close" id="sidebar-close">&times;</button>
        </div>
        <nav class="admin-sidebar-nav">${renderNav(activeRoute)}</nav>
      </aside>
      <div class="admin-main">
        <header class="admin-topbar">
          <button class="admin-icon-btn admin-menu-toggle" id="sidebar-toggle">
            <span class="material-symbols-rounded">menu</span>
          </button>
          <div class="admin-topbar-right">
            <span class="admin-topbar-role tag tag--primary">${esc(profile?.role || '')}</span>
            <span class="admin-topbar-user">${esc(profile?.full_name || profile?.email || 'Admin')}</span>
            <button class="admin-btn admin-btn--ghost admin-btn--sm" id="admin-logout">
              <span class="material-symbols-rounded" style="font-size:18px">logout</span> Logout
            </button>
          </div>
        </header>
        <div class="admin-content" id="admin-content"></div>
      </div>
    </div>`;

  // Bind sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.toggle('open');
  });
  document.getElementById('sidebar-close')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.remove('open');
  });

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await signOut();
    navigate(ADMIN_PATH);
  });

  // Nav links
  document.querySelectorAll('.admin-sidebar-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      document.getElementById('admin-sidebar').classList.remove('open');
    });
  });
}

function renderNav(activeRoute) {
  return NAV_SECTIONS.map(section => {
    const items = section.items.filter(item => {
      if (!item.perm) return true;
      return Store.can(item.perm);
    });
    if (!items.length) return '';
    return `<div class="admin-nav-section">
      <div class="admin-nav-heading">${section.heading}</div>
      ${items.map(item => {
        const fullRoute = ADMIN_PATH + (item.route ? '/' + item.route : '');
        const isActive = item.route ? activeRoute.startsWith(item.route) : (activeRoute === '');
        return `<a href="#/${fullRoute}" class="admin-nav-link ${isActive ? 'active' : ''}">
          <span class="material-symbols-rounded">${item.icon}</span>
          <span>${item.label}</span>
        </a>`;
      }).join('')}
    </div>`;
  }).join('');
}

export function setContent(html) {
  const el = document.getElementById('admin-content');
  if (el) el.innerHTML = html;
}

export function getContentEl() {
  return document.getElementById('admin-content');
}
