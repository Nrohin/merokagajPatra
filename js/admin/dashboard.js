
import { getStats, getRecentUpdates } from './db.js';
import { esc } from './ui.js';
import { CONFIG } from '../config.js';
import { formatDate } from '../utils/dom.js';

export async function render(container) {
  container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div>Loading dashboard...</div>';

  let stats = {}, recent = [];
  try {
    [stats, recent] = await Promise.all([getStats(), getRecentUpdates(8)]);
  } catch (err) {
    container.innerHTML = `<div class="admin-alert admin-alert--error">Could not load dashboard data. ${esc(err.message)}</div>`;
    return;
  }

  const cards = [
    { label: 'Services', count: stats.services || 0, icon: 'description', route: 'services' },
    { label: 'Offices', count: stats.offices || 0, icon: 'location_on', route: 'offices' },
    { label: 'FAQs', count: stats.faqs || 0, icon: 'help', route: 'faqs' },
    { label: 'News', count: stats.news || 0, icon: 'newspaper', route: 'news' },
    { label: 'Departments', count: stats.departments || 0, icon: 'account_balance', route: 'departments' },
    { label: 'Life Events', count: stats.life_events || 0, icon: 'celebration', route: 'life-events' },
    { label: 'Drafts', count: stats.drafts || 0, icon: 'edit_note', route: 'services', accent: true },
  ];

  container.innerHTML = `
    <div class="admin-page-header">
      <h1>Dashboard</h1>
      <p>Welcome back. Here's an overview of your website content.</p>
    </div>

    <div class="admin-stat-cards">
      ${cards.map(c => `
        <a href="#/${CONFIG.ADMIN_PATH}/${c.route}" class="admin-stat-card ${c.accent ? 'admin-stat-card--accent' : ''}">
          <span class="material-symbols-rounded admin-stat-icon">${c.icon}</span>
          <div class="admin-stat-value">${c.count}</div>
          <div class="admin-stat-label">${c.label}</div>
        </a>
      `).join('')}
    </div>

    <div class="admin-section">
      <h2>Recent Updates</h2>
      ${recent.length ? recent.map(r => `
        <div class="admin-recent-item">
          <span class="material-symbols-rounded" style="color:var(--text-tertiary)">description</span>
          <div style="flex:1">
            <div style="font-weight:500">${esc(r.name.en || r.name.ne)}</div>
            <div style="font-size:var(--text-xs);color:var(--text-tertiary)">
              Updated ${formatDate(r.updatedAt, 'en')} by ${esc(r.updatedBy)}
            </div>
          </div>
          <a href="#/${CONFIG.ADMIN_PATH}/services/${r.id}" class="admin-btn admin-btn--ghost admin-btn--sm">Edit</a>
        </div>
      `).join('') : '<p style="color:var(--text-tertiary)">No recent updates found.</p>'}
    </div>
  `;
}
