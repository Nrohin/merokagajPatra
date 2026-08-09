
import * as db from '../db.js';
import { esc, showToast, setDirty } from '../ui.js';
import { from } from '../../supabase.js';

export async function render(container) {
  let data = [];
  let search = '';

  async function load() {
    container.querySelector('.admin-trans-body').innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';
    let q = from('translations').select('key, en, ne').order('key');
    if (search) q = q.ilike('key', '%' + search + '%');
    q = q.range(0, 499);
    const { data: rows, error } = await q;
    if (error) { showToast('Failed to load translations: ' + error.message, 'error'); return; }
    data = rows || [];
    renderBody();
  }

  function renderBody() {
    const body = container.querySelector('.admin-trans-body');
    if (!data.length) { body.innerHTML = '<div class="admin-empty"><p>No translations found.</p></div>'; return; }
    body.innerHTML = data.map(row => `
      <div class="admin-trans-row" data-key="${esc(row.key)}">
        <div class="admin-trans-key"><code>${esc(row.key)}</code></div>
        <div class="admin-trans-cols">
          <div class="admin-trans-col">
            <label>🇬🇧 English</label>
            <input class="admin-input admin-trans-en" value="${esc(row.en)}">
          </div>
          <div class="admin-trans-col">
            <label>🇳🇵 नेपाली</label>
            <input class="admin-input admin-trans-ne" value="${esc(row.ne)}">
          </div>
        </div>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:var(--space-2)">translate</span>Translations</h1>
        <p>Edit English and Nepali UI strings. Click "Save All Changes" when done.</p>
      </div>
      <button class="admin-btn admin-btn--primary" id="trans-save">Save All Changes</button>
    </div>
    <div class="admin-list-toolbar">
      <input class="admin-input admin-search" placeholder="Search translation keys..." type="search">
    </div>
    <div class="admin-trans-body"></div>
  `;

  const searchInput = container.querySelector('.admin-search');
  let timer;
  searchInput?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { search = searchInput.value; load(); }, 300); });

  container.querySelector('#trans-save').addEventListener('click', async () => {
    const rows = container.querySelectorAll('.admin-trans-row');
    const updates = [];
    rows.forEach(row => {
      const key = row.dataset.key;
      const en = row.querySelector('.admin-trans-en').value;
      const ne = row.querySelector('.admin-trans-ne').value;
      updates.push({ key, en, ne });
    });
    try {
      // Batch upsert
      const { error } = await from('translations').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      await db.logAction('updated', 'translations', 'batch', { count: updates.length });
      showToast('Translations saved!', 'success');
      setDirty(false);
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  });

  container.querySelector('#admin-editor-form, .admin-trans-body')?.addEventListener('input', () => setDirty(true));
  load();
}
