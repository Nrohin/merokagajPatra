
import * as db from './db.js';
import * as Store from './store.js';
import { esc, showToast, confirmDialog, dataTable, field, selectField, getFormData, setDirty } from './ui.js';
import { CONFIG } from '../config.js';

const ADMIN_PATH = CONFIG.ADMIN_PATH;
const nav = (path) => { window.location.hash = '#/' + ADMIN_PATH + '/' + path; };

/**
 * Generic list view
 * @param {HTMLElement} container
 * @param {object} cfg
 */
export async function renderList(container, cfg) {
  const { table, title, icon, searchFields = [], statusOptions = true, columns = [], orderField = 'updated_at.desc' } = cfg;
  let search = '', status = '', page = 0;
  const pageSize = 50;

  async function load() {
    container.querySelector('.admin-list-body').innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';
    const { data, total } = await db.list(table, {
      search, searchFields, status,
      order: orderField,
      limit: pageSize, offset: page * pageSize,
    });
    renderBody(data, total);
  }

  function renderBody(rows, total) {
    const body = container.querySelector('.admin-list-body');
    const rowsHtml = dataTable(columns, rows, (row) => `
      <a href="#/${ADMIN_PATH}/${cfg.route || table}/${row.id}" class="admin-btn admin-btn--ghost admin-btn--sm">Edit</a>
      ${Store.can('delete') ? `<button class="admin-btn admin-btn--ghost admin-btn--sm admin-btn--danger-text" data-delete="${row.id}">Delete</button>` : ''}
    `);
    body.innerHTML = rowsHtml;
    // Bind delete
    body.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delete;
        const ok = await confirmDialog({
          title: `Delete ${cfg.singular || title}?`,
          message: 'This action cannot be easily undone.',
          confirmText: 'Delete',
          danger: true,
        });
        if (!ok) return;
        try {
          await db.remove(table, id);
          await db.logAction('deleted', cfg.singular || title, id);
          showToast('Item deleted.', 'success');
          load();
        } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
      });
    });
    // Pagination
    const totalPages = Math.ceil(total / pageSize);
    const pagination = container.querySelector('.admin-pagination');
    if (pagination) {
      pagination.innerHTML = totalPages > 1 ? `
        <button class="admin-btn admin-btn--sm" ${page === 0 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>
        <span>Page ${page + 1} of ${totalPages} (${total} total)</span>
        <button class="admin-btn admin-btn--sm" ${page >= totalPages - 1 ? 'disabled' : ''} data-page="${page + 1}">Next</button>
      ` : (total > 0 ? `<span>${total} item${total !== 1 ? 's' : ''}</span>` : '');
      pagination.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { page = parseInt(btn.dataset.page); load(); });
      });
    }
    // Count badge
    const countEl = container.querySelector('.admin-list-count');
    if (countEl) countEl.textContent = total || 0;
  }

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:var(--space-2)">${icon || 'list'}</span>${esc(title)}</h1>
        <p><span class="admin-list-count">0</span> items</p>
      </div>
      <a href="#/${ADMIN_PATH}/${cfg.route || table}/new" class="admin-btn admin-btn--primary">+ Add ${cfg.singular || title}</a>
    </div>
    <div class="admin-list-toolbar">
      <input class="admin-input admin-search" placeholder="Search..." type="search">
      ${statusOptions ? `
        <select class="admin-input admin-status-filter" style="width:auto">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      ` : ''}
    </div>
    <div class="admin-list-body"></div>
    <div class="admin-pagination"></div>
  `;

  const searchInput = container.querySelector('.admin-search');
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { search = searchInput.value; page = 0; load(); }, 300);
  });
  container.querySelector('.admin-status-filter')?.addEventListener('change', (e) => {
    status = e.target.value; page = 0; load();
  });

  load();
}

/**
 * Generic editor view
 */
export async function renderEditor(container, cfg, id) {
  const isNew = !id || id === 'new';
  const title = isNew ? `New ${cfg.singular || cfg.title}` : `Edit ${cfg.singular || cfg.title}`;
  let row = {};

  if (!isNew) {
    try {
      row = await db.get(cfg.table, id);
    } catch (err) {
      container.innerHTML = `<div class="admin-alert admin-alert--error">Item not found. ${esc(err.message)}</div>`;
      return;
    }
  }

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <a href="#/${ADMIN_PATH}/${cfg.route || cfg.table}" class="admin-back-link">&larr; Back to ${esc(cfg.title)}</a>
        <h1>${esc(title)}</h1>
      </div>
      <div class="admin-page-actions">
        ${(!isNew && Store.can('delete')) ? `<button class="admin-btn admin-btn--danger admin-btn--sm" id="editor-delete">Delete</button>` : ''}
      </div>
    </div>
    <form id="admin-editor-form" class="admin-form">
      ${cfg.renderForm ? cfg.renderForm(row) : renderDefaultFields(cfg.fields, row)}
      <div class="admin-form-footer">
        <a href="#/${ADMIN_PATH}/${cfg.route || cfg.table}" class="admin-btn admin-btn--secondary">Cancel</a>
        <button class="admin-btn admin-btn--primary" type="submit">
          ${isNew ? 'Add ' + (cfg.singular || cfg.title) : 'Save Changes'}
        </button>
      </div>
    </form>
  `;

  setDirty(false);
  container.querySelector('#admin-editor-form')?.addEventListener('input', () => setDirty(true));

  // Populate selects
  if (cfg.populateSelects) {
    await cfg.populateSelects(container, row);
  }

  // Save
  container.querySelector('#admin-editor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getFormData(e.target);
    let mapped;
    try {
      if (isNew && cfg.beforeCreate) {
        Object.assign(data, await cfg.beforeCreate(data));
      }
      // Map fields back to DB columns
      mapped = cfg.mapToDb ? cfg.mapToDb(data, row) : data;
      if (isNew) {
        const created = await db.insert(cfg.table, mapped);
        await db.logAction('created', cfg.singular || cfg.title, created.id);
        showToast(`${cfg.singular || cfg.title} created!`, 'success');
      } else {
        const merged = { ...row, ...mapped };
        await db.update(cfg.table, id, merged);
        await db.logAction('updated', cfg.singular || cfg.title, id);
        showToast('Changes saved!', 'success');
      }
      setDirty(false);
      nav(cfg.route || cfg.table);
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  });

  // Delete
  container.querySelector('#editor-delete')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: `Delete ${cfg.singular || cfg.title}?`,
      message: 'This action cannot be easily undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await db.remove(cfg.table, id);
      await db.logAction('deleted', cfg.singular || cfg.title, id);
      showToast('Item deleted.', 'success');
      setDirty(false);
      nav(cfg.route || cfg.table);
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  });
}

function renderDefaultFields(fields, row) {
  if (!fields) return '';
  return fields.map(f => {
    const val = row[f.dbKey || f.name] ?? f.defaultValue ?? '';
    if (f.type === 'bilingual') {
      const enVal = row[f.enKey || f.name + '_en'] ?? row[f.name]?.en ?? '';
      const neVal = row[f.neKey || f.name + '_ne'] ?? row[f.name]?.ne ?? '';
      return `
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">
            ${field({ name: f.enKey || f.name + '_en', label: '🇬🇧 ' + (f.enLabel || f.label), value: enVal, type: f.inputType || 'input', required: f.required })}
          </div>
          <div class="admin-bilingual-col">
            ${field({ name: f.neKey || f.name + '_ne', label: '🇳🇵 ' + (f.neLabel || f.label), value: neVal, type: f.inputType || 'input', required: f.required })}
          </div>
        </div>`;
    }
    if (f.type === 'select') {
      if (f.name === 'status' && !Store.can('publish')) {
        // Editors cannot publish — status locked to draft
        return `
          <div class="admin-field">
            <label class="admin-label">${esc(f.label)}</label>
            <input class="admin-input" name="status" value="draft" readonly>
            <small class="admin-help">Only Administrators can publish. You can save this as a draft.</small>
          </div>`;
      }
      return selectField({ name: f.name, label: f.label, value: val, options: f.options, required: f.required });
    }
    return field({ name: f.name, label: f.label, value: val, type: f.type || 'text', required: f.required, help: f.help });
  }).join('');
}

export { field, selectField, esc, showToast, confirmDialog, setDirty };
