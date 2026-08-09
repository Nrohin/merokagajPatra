
import { from } from '../../supabase.js';
import { showToast, esc, setDirty, getFormData } from '../ui.js';
import * as db from '../db.js';

export async function render(container) {
  container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

  const { data } = await from('settings').select('*');
  const settings = {};
  (data || []).forEach(s => { settings[s.key] = s.value; });

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:var(--space-2)">settings</span>Settings</h1>
        <p>Site configuration (Super Admin only)</p>
      </div>
    </div>
    <form id="admin-settings-form" class="admin-form admin-settings-grid">
      <div class="admin-section">
        <h2>General</h2>
        <div class="admin-field">
          <label class="admin-label">Site Name (English)</label>
          <input class="admin-input" name="site_name_en" value="${esc(settings.site_name_en?.replace(/"/g,'') || 'MeroKagajPatra')}">
        </div>
        <div class="admin-field">
          <label class="admin-label">Site Name (नेपाली)</label>
          <input class="admin-input" name="site_name_ne" value="${esc(settings.site_name_ne?.replace(/"/g,'') || 'मेरोकागजपत्र')}">
        </div>
        <div class="admin-field">
          <label class="admin-label">Admin Secret Path</label>
          <input class="admin-input" name="admin_path" value="${esc(settings.admin_path?.replace(/"/g,'') || 'manage-portal-x7k9')}" disabled>
          <small class="admin-help">Change this in js/config.js instead.</small>
        </div>
      </div>
      <div class="admin-field">
        <button class="admin-btn admin-btn--primary" type="submit">Save Settings</button>
      </div>
    </form>
  `;

  container.querySelector('#admin-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getFormData(e.target);
    try {
      for (const [key, value] of Object.entries(data)) {
        await from('settings').upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' });
      }
      await db.logAction('updated', 'settings', 'general');
      showToast('Settings saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  });
}
