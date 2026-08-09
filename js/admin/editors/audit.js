
import { from } from '../../supabase.js';
import { esc } from '../ui.js';
import { formatDate } from '../../utils/dom.js';

export async function render(container) {
  container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

  const { data, error } = await from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 99);

  if (error) {
    container.innerHTML = `<div class="admin-alert admin-alert--error">Could not load audit log. ${esc(error.message)}</div>`;
    return;
  }

  const rows = data || [];

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:var(--space-2)">history</span>Audit Log</h1>
        <p>Recent administrator actions (${rows.length} shown)</p>
      </div>
    </div>
    ${rows.length ? `
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Date</th><th>Admin</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr></thead>
        <tbody>${rows.map(r => `<tr>
          <td style="white-space:nowrap">${formatDate(r.created_at, 'en')}</td>
          <td>${esc(r.admin_email)}</td>
          <td><span class="tag tag--primary">${esc(r.action)}</span></td>
          <td>${esc(r.entity_type)}</td>
          <td><code style="font-size:var(--text-xs)">${esc(r.entity_id || '')}</code></td>
        </tr>`).join('')}</tbody>
      </table></div>
    ` : '<div class="admin-empty"><p>No audit log entries yet.</p></div>'}
  `;
}
