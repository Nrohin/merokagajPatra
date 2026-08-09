
import * as db from '../db.js';
import * as Store from '../store.js';
import { esc, showToast, confirmDialog, setDirty, field, selectField, getFormData } from '../ui.js';
import { CONFIG } from '../../config.js';
import { from } from '../../supabase.js';

const ADMIN_PATH = CONFIG.ADMIN_PATH;
const nav = (path) => { window.location.hash = '#/' + ADMIN_PATH + '/' + path; };

const CATEGORIES = [
  ['civil','Civil Documents'],['family','Family & Social'],['travel','Travel & Immigration'],
  ['education','Education'],['business','Business & Trade'],['property','Property & Land'],
  ['health','Health'],['vehicle','Vehicle & Transport'],['employment','Employment'],
  ['other','Other'],
];

const ICONS = [
  'badge','description','assignment','flight','directions_car','school','work',
  'home','business','medical_services','family_restroom','account_balance','menu_book',
  'event','child_care','payments','schedule','help','location_on','star','more_horiz',
];

// ══════════════════════════════════════════════════════════════
// List view
// ══════════════════════════════════════════════════════════════

export async function renderList(container) {
  let search = '', status = '', category = '', page = 0;
  const pageSize = 25;

  async function load() {
    container.querySelector('.admin-list-body').innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';
    const { data, total } = await db.list('services', {
      search, searchFields: ['name_en', 'name_ne', 'description_en'], status,
      order: 'name_en.asc', limit: pageSize, offset: page * pageSize,
    });

    let rows = data || [];
    if (category) rows = rows.filter(r => r.category === category);

    const body = container.querySelector('.admin-list-body');
    if (!rows.length) { body.innerHTML = '<div class="admin-empty"><span class="material-symbols-rounded">inbox</span><p>No services found.</p></div>'; return; }

    body.innerHTML = `
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr>
          <th>Service</th><th>Category</th><th>Icon</th><th>Popular</th><th>Status</th><th>Updated</th><th style="width:180px">Actions</th>
        </tr></thead>
        <tbody>${rows.map(r => `
          <tr>
            <td>
              <div style="font-weight:500">${esc(r.name_en)}</div>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${esc(r.name_ne)}</div>
            </td>
            <td><span class="tag">${esc(r.category)}</span></td>
            <td><span class="material-symbols-rounded" style="vertical-align:middle">${esc(r.icon || 'description')}</span></td>
            <td>${r.popular ? '✅' : ''}</td>
            <td><span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span></td>
            <td style="white-space:nowrap;font-size:var(--text-xs)">${r.last_updated || ''}</td>
            <td class="admin-table-actions">
              <a href="#/${ADMIN_PATH}/services/${r.id}" class="admin-btn admin-btn--ghost admin-btn--sm">Edit</a>
              <a href="#/service/${r.id}" target="_blank" class="admin-btn admin-btn--ghost admin-btn--sm">View</a>
              ${Store.can('delete') ? `<button class="admin-btn admin-btn--ghost admin-btn--sm admin-btn--danger-text" data-delete="${r.id}">Delete</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

    // Delete buttons
    body.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delete;
        const ok = await confirmDialog({
          title: 'Delete Service?',
          message: `Delete "${id}"? This action cannot be easily undone.`,
          confirmText: 'Delete', danger: true,
        });
        if (!ok) return;
        try {
          await db.remove('services', id);
          await db.logAction('deleted', 'Service', id);
          showToast('Service deleted.', 'success');
          load();
        } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
      });
    });

    // Pagination
    const pagination = container.querySelector('.admin-pagination');
    const totalPages = Math.ceil(total / pageSize);
    pagination.innerHTML = totalPages > 1 ? `
      <button class="admin-btn admin-btn--sm" ${page === 0 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>
      <span>Page ${page + 1} of ${totalPages} (${total} total)</span>
      <button class="admin-btn admin-btn--sm" ${page >= totalPages - 1 ? 'disabled' : ''} data-page="${page + 1}">Next</button>
    ` : `<span>${total} services</span>`;
    pagination.querySelectorAll('[data-page]').forEach(b => {
      b.addEventListener('click', () => { page = parseInt(b.dataset.page); load(); });
    });
    container.querySelector('.admin-list-count').textContent = total || 0;
  }

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:var(--space-2)">description</span>Services</h1>
        <p><span class="admin-list-count">0</span> services</p>
      </div>
      <a href="#/${ADMIN_PATH}/services/new" class="admin-btn admin-btn--primary">+ Add Service</a>
    </div>
    <div class="admin-list-toolbar">
      <input class="admin-input admin-search" placeholder="Search services..." type="search">
      <select class="admin-input admin-status-filter" style="width:auto">
        <option value="">All Status</option><option value="published">Published</option><option value="draft">Draft</option>
      </select>
      <select class="admin-input admin-category-filter" style="width:auto">
        <option value="">All Categories</option>
        ${CATEGORIES.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
    <div class="admin-list-body"></div>
    <div class="admin-pagination"></div>
  `;

  let timer;
  container.querySelector('.admin-search').addEventListener('input', () => {
    clearTimeout(timer); timer = setTimeout(() => { search = container.querySelector('.admin-search').value; page = 0; load(); }, 300);
  });
  container.querySelector('.admin-status-filter').addEventListener('change', e => { status = e.target.value; page = 0; load(); });
  container.querySelector('.admin-category-filter').addEventListener('change', e => { category = e.target.value; page = 0; load(); });

  load();
}

// ══════════════════════════════════════════════════════════════
// Editor view
// ══════════════════════════════════════════════════════════════

export async function renderEdit(container, id) {
  const isNew = id === 'new';
  let svc = {};
  let allServices = [];
  let allDepartments = [];

  // Load related lists
  const [{ data: services }, { data: departments }] = await Promise.all([
    from('services').select('id, name_en, name_ne').order('name_en').limit(1000),
    from('departments').select('id, name_en').order('name_en').limit(100),
  ]);
  allServices = services || [];
  allDepartments = departments || [];

  if (!isNew) {
    try { svc = await db.get('services', id); } catch (err) {
      container.innerHTML = `<div class="admin-alert admin-alert--error">Service not found. ${esc(err.message)}</div>`;
      return;
    }
  }

  renderForm(container, svc, isNew, allServices, allDepartments);
}

function renderForm(container, svc, isNew, allServices, allDepartments) {
  const title = isNew ? 'Add Service' : 'Edit Service';
  const s = svc || {};

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <a href="#/${ADMIN_PATH}/services" class="admin-back-link">&larr; Back to Services</a>
        <h1>${title}: <span style="font-weight:400;color:var(--text-tertiary)">${esc(s.name_en || s.id || 'New Service')}</span></h1>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        ${!isNew ? `
          <a href="#/service/${s.id}" target="_blank" class="admin-btn admin-btn--secondary">Preview</a>
          ${Store.can('delete') ? `<button class="admin-btn admin-btn--danger admin-btn--sm" id="svc-delete">Delete</button>` : ''}
        ` : ''}
      </div>
    </div>

    <form id="svc-form" class="admin-form">
      <!-- Basic info -->
      <div class="admin-section">
        <h2>Basic Information</h2>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:'name_en', label:'🇬🇧 Service Name', value:s.name_en, required:true })}</div>
          <div class="admin-bilingual-col">${field({ name:'name_ne', label:'🇳🇵 सेवाको नाम', value:s.name_ne, required:true })}</div>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:'description_en', label:'🇬🇧 Description', value:s.description_en, type:'textarea', required:true })}</div>
          <div class="admin-bilingual-col">${field({ name:'description_ne', label:'🇳🇵 विवरण', value:s.description_ne, type:'textarea', required:true })}</div>
        </div>
        <div class="admin-form-grid">
          ${field({ name:'id', label:'Service ID (slug)', value:s.id, required:true, help: isNew ? 'Unique URL slug (e.g., "citizenship-certificate"). Auto-fills from English name.' : 'Changing this will break existing links.' })}
          ${selectField({ name:'category', label:'Category', value:s.category || 'other', options: CATEGORIES.map(([v,l])=>({value:v,label:l})) , required:true })}
          <div class="admin-field">
            <label class="admin-label">Icon</label>
            <div class="admin-icon-row" id="icon-row">
              ${ICONS.map(i => `<button type="button" class="admin-icon-btn ${s.icon === i ? 'active' : ''}" data-icon="${i}" title="${i}"><span class="material-symbols-rounded">${i}</span></button>`).join('')}
              <input class="admin-input" name="icon" id="icon-input" value="${esc(s.icon || 'description')}" style="display:none">
            </div>
            <small class="admin-help">Click an icon or type a Material Symbols name.</small>
          </div>
          <div class="admin-field">
            <label class="admin-label">Sub-category</label>
            <input class="admin-input" name="sub_category" value="${esc(s.sub_category || '')}" placeholder="e.g., naturalized, local-registration, tax">
            <small class="admin-help">Optional. Used by business/property overview pages.</small>
          </div>
          <div class="admin-field">
            <label class="admin-label">Department</label>
            <select class="admin-input" name="department_id">
              <option value="">-- None --</option>
              ${allDepartments.map(d => `<option value="${esc(d.id)}" ${s.department_id === d.id ? 'selected' : ''}>${esc(d.name_en)}</option>`).join('')}
            </select>
          </div>
          <div class="admin-field">
            <label class="admin-label">Keywords</label>
            <input class="admin-input" name="keywords" value="${esc((s.keywords || []).join(', '))}" placeholder="citizenship, nagarikta, birth">
            <small class="admin-help">Comma-separated search keywords (English + romanized Nepali).</small>
          </div>
          <div class="admin-field">
            <label class="admin-label">Last Updated</label>
            <input class="admin-input" type="date" name="last_updated" value="${esc(s.last_updated || '')}">
            <small class="admin-help">Auto-suggested; you can leave blank.</small>
          </div>
        </div>
        <div class="admin-field admin-field--inline">
          <label class="admin-checkbox"><input type="checkbox" name="popular" ${s.popular ? 'checked' : ''}> ⭐ Popular service</label>
          <label class="admin-checkbox"><input type="checkbox" name="online_available" ${s.online_available ? 'checked' : ''}> 💻 Available online</label>
        </div>
      </div>

      <!-- Steps -->
      <div class="admin-section">
        <h2>Process Steps</h2>
        <p class="admin-section-desc">These appear in order on the public service page.</p>
        <div id="steps-list"></div>
        <button type="button" class="admin-btn admin-btn--secondary" id="add-step">+ Add Step</button>
      </div>

      <!-- Documents -->
      <div class="admin-section">
        <h2>Required Documents</h2>
        <div id="docs-list"></div>
        <button type="button" class="admin-btn admin-btn--secondary" id="add-doc">+ Add Document</button>
      </div>

      <!-- Common mistakes -->
      <div class="admin-section">
        <h2>Common Mistakes</h2>
        <div id="mistakes-list"></div>
        <button type="button" class="admin-btn admin-btn--secondary" id="add-mistake">+ Add Mistake</button>
      </div>

      <!-- Tips -->
      <div class="admin-section">
        <h2>Tips</h2>
        <div id="tips-list"></div>
        <button type="button" class="admin-btn admin-btn--secondary" id="add-tip">+ Add Tip</button>
      </div>

      <!-- Fees + processing (inline) -->
      <div class="admin-section">
        <h2>Fees & Processing Time</h2>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:'fees_summary_en', label:'🇬🇧 Fee Summary (English)', value:s.fees_summary_en, type:'textarea' })}</div>
          <div class="admin-bilingual-col">${field({ name:'fees_summary_ne', label:'🇳🇵 शुल्क सारांश (नेपाली)', value:s.fees_summary_ne, type:'textarea' })}</div>
        </div>
        <div class="admin-form-grid">
          ${field({ name:'processing_standard_days', label:'Standard Days', value:s.processing_standard_days, type:'number' })}
          ${field({ name:'processing_express_days', label:'Express Days', value:s.processing_express_days, type:'number' })}
          ${field({ name:'processing_max_days', label:'Maximum Days', value:s.processing_max_days, type:'number' })}
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:'processing_note_en', label:'🇬🇧 Processing Note (English)', value:s.processing_note_en, type:'textarea' })}</div>
          <div class="admin-bilingual-col">${field({ name:'processing_note_ne', label:'🇳🇵 प्रक्रिया नोट (नेपाली)', value:s.processing_note_ne, type:'textarea' })}</div>
        </div>
      </div>

      <!-- Related services -->
      <div class="admin-section">
        <h2>Related Services</h2>
        <div id="related-picker"></div>
      </div>

      <!-- Official sources -->
      <div class="admin-section">
        <h2>Official References</h2>
        <div id="sources-list"></div>
        <button type="button" class="admin-btn admin-btn--secondary" id="add-source">+ Add Source</button>
      </div>

      <!-- Status -->
      <div class="admin-section">
        <h2>Publication</h2>
        <div class="admin-field">
          <label class="admin-label">Status</label>
          ${Store.can('publish')
            ? `<select class="admin-input" name="status" id="svc-status">
                 <option value="draft" ${s.status === 'draft' || isNew ? 'selected' : ''}>Draft</option>
                 <option value="published" ${s.status === 'published' ? 'selected' : ''}>Published</option>
               </select>`
            : `<input class="admin-input" name="status" value="draft" readonly>
               <small class="admin-help">Only Administrators can publish. You can save this as a draft.</small>`}
          <small class="admin-help">Draft content is only visible to admins. Published content appears on the public site.</small>
        </div>
      </div>

      <div class="admin-form-footer">
        <a href="#/${ADMIN_PATH}/services" class="admin-btn admin-btn--secondary">Cancel</a>
        <button class="admin-btn admin-btn--secondary" type="button" id="svc-save-draft">Save Draft</button>
        ${!isNew ? `<a href="#/service/${esc(s.id)}" target="_blank" class="admin-btn admin-btn--secondary">Preview</a>` : ''}
        ${Store.can('publish')
          ? `<button class="admin-btn admin-btn--primary" type="submit">${isNew ? 'Add Service' : 'Publish'}</button>`
          : `<button class="admin-btn admin-btn--primary" type="submit">Save Changes</button>`}
      </div>
    </form>
  `;

  setDirty(false);
  container.querySelector('#svc-form').addEventListener('input', () => setDirty(true));

  // Icon picker
  container.querySelectorAll('#icon-row .admin-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#icon-row .admin-icon-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('icon-input').value = btn.dataset.icon;
    });
  });

  // Steps list editor
  const steps = s.steps || [];
  const docs = s.documents || [];
  const mistakes = s.common_mistakes || [];
  const tips = s.tips || [];
  const sources = s.official_sources || [];
  const related = s.related_services || [];

  renderSteps(steps);
  renderDocs(docs);
  renderMistakes(mistakes);
  renderTips(tips);
  renderSources(sources);
  renderRelated(related);

  container.querySelector('#add-step').addEventListener('click', () => { steps.push({ title:{en:'',ne:''}, description:{en:'',ne:''} }); renderSteps(steps); setDirty(true); });
  container.querySelector('#add-doc').addEventListener('click', () => { docs.push({ name:{en:'',ne:''}, required:true }); renderDocs(docs); setDirty(true); });
  container.querySelector('#add-mistake').addEventListener('click', () => { mistakes.push({en:'',ne:''}); renderMistakes(mistakes); setDirty(true); });
  container.querySelector('#add-tip').addEventListener('click', () => { tips.push({en:'',ne:''}); renderTips(tips); setDirty(true); });
  container.querySelector('#add-source').addEventListener('click', () => { sources.push({name:'',url:''}); renderSources(sources); setDirty(true); });

  function renderSteps(items) {
    const el = document.getElementById('steps-list');
    el.innerHTML = items.map((st, i) => `
      <div class="admin-list-editor-item" data-step="${i}">
        <div class="admin-list-editor-head">
          <span class="admin-list-editor-index">Step ${i + 1}</span>
          <div style="display:flex;gap:var(--space-1)">
            <button type="button" class="admin-icon-btn" data-move-step="${i}" data-dir="-1" title="Move up">↑</button>
            <button type="button" class="admin-icon-btn" data-move-step="${i}" data-dir="1" title="Move down">↓</button>
            <button type="button" class="admin-icon-btn admin-btn--danger-text" data-del-step="${i}" title="Delete step">&times;</button>
          </div>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:`step_${i}_title_en`, label:'🇬🇧 Title', value:st.title?.en || '' })}</div>
          <div class="admin-bilingual-col">${field({ name:`step_${i}_title_ne`, label:'🇳🇵 शीर्षक', value:st.title?.ne || '' })}</div>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:`step_${i}_desc_en`, label:'🇬🇧 Description', value:st.description?.en || '', type:'textarea' })}</div>
          <div class="admin-bilingual-col">${field({ name:`step_${i}_desc_ne`, label:'🇳🇵 विवरण', value:st.description?.ne || '', type:'textarea' })}</div>
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-move-step]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.moveStep);
        const dir = parseInt(b.dataset.dir);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= items.length) return;
        [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
        renderSteps(items); setDirty(true);
      });
    });
    el.querySelectorAll('[data-del-step]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = parseInt(b.dataset.delStep);
        const ok = await confirmDialog({ title: 'Delete Step?', message: 'This step will be removed from the guide.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        items.splice(idx, 1);
        renderSteps(items); setDirty(true);
      });
    });
  }

  function renderDocs(items) {
    const el = document.getElementById('docs-list');
    el.innerHTML = items.map((d, i) => `
      <div class="admin-list-editor-item" data-doc="${i}">
        <div class="admin-list-editor-head">
          <span class="admin-list-editor-index">Document ${i + 1}</span>
          <div style="display:flex;gap:var(--space-1)">
            <label class="admin-checkbox" style="margin:0;font-size:var(--text-xs)">
              <input type="checkbox" data-doc-req="${i}" ${d.required !== false ? 'checked' : ''}> Required
            </label>
            <button type="button" class="admin-icon-btn" data-move-doc="${i}" data-dir="-1">↑</button>
            <button type="button" class="admin-icon-btn" data-move-doc="${i}" data-dir="1">↓</button>
            <button type="button" class="admin-icon-btn admin-btn--danger-text" data-del-doc="${i}">&times;</button>
          </div>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:`doc_${i}_name_en`, label:'🇬🇧 Document name', value:d.name?.en || '' })}</div>
          <div class="admin-bilingual-col">${field({ name:`doc_${i}_name_ne`, label:'🇳🇵 कागजातको नाम', value:d.name?.ne || '' })}</div>
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-move-doc]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.moveDoc), dir = parseInt(b.dataset.dir), ni = idx + dir;
        if (ni < 0 || ni >= items.length) return;
        [items[idx], items[ni]] = [items[ni], items[idx]];
        renderDocs(items); setDirty(true);
      });
    });
    el.querySelectorAll('[data-del-doc]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = parseInt(b.dataset.delDoc);
        const ok = await confirmDialog({ title: 'Delete Document?', message: 'This document will be removed from the checklist.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        items.splice(idx, 1); renderDocs(items); setDirty(true);
      });
    });
    el.querySelectorAll('[data-doc-req]').forEach(cb => {
      cb.addEventListener('change', () => { items[parseInt(cb.dataset.docReq)].required = cb.checked; setDirty(true); });
    });
  }

  function renderMistakes(items) {
    const el = document.getElementById('mistakes-list');
    el.innerHTML = items.map((m, i) => `
      <div class="admin-list-editor-item" data-mistake="${i}">
        <div class="admin-list-editor-head">
          <span class="admin-list-editor-index">Mistake ${i + 1}</span>
          <button type="button" class="admin-icon-btn admin-btn--danger-text" data-del-mistake="${i}">&times;</button>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:`mistake_${i}_en`, label:'🇬🇧 Mistake', value:m.en || '' })}</div>
          <div class="admin-bilingual-col">${field({ name:`mistake_${i}_ne`, label:'🇳🇵 गल्ती', value:m.ne || '' })}</div>
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-del-mistake]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = parseInt(b.dataset.delMistake);
        const ok = await confirmDialog({ title: 'Delete Mistake?', message: 'This will be removed from the service page.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        items.splice(idx, 1); renderMistakes(items); setDirty(true);
      });
    });
  }

  function renderTips(items) {
    const el = document.getElementById('tips-list');
    el.innerHTML = items.map((tip, i) => `
      <div class="admin-list-editor-item" data-tip="${i}">
        <div class="admin-list-editor-head">
          <span class="admin-list-editor-index">Tip ${i + 1}</span>
          <button type="button" class="admin-icon-btn admin-btn--danger-text" data-del-tip="${i}">&times;</button>
        </div>
        <div class="admin-bilingual">
          <div class="admin-bilingual-col">${field({ name:`tip_${i}_en`, label:'🇬🇧 Tip', value:tip.en || '' })}</div>
          <div class="admin-bilingual-col">${field({ name:`tip_${i}_ne`, label:'🇳🇵 सुझाव', value:tip.ne || '' })}</div>
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-del-tip]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = parseInt(b.dataset.delTip);
        const ok = await confirmDialog({ title: 'Delete Tip?', message: 'This tip will be removed.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        items.splice(idx, 1); renderTips(items); setDirty(true);
      });
    });
  }

  function renderSources(items) {
    const el = document.getElementById('sources-list');
    el.innerHTML = items.map((s, i) => `
      <div class="admin-list-editor-item" data-source="${i}">
        <div class="admin-list-editor-head">
          <span class="admin-list-editor-index">Source ${i + 1}</span>
          <button type="button" class="admin-icon-btn admin-btn--danger-text" data-del-source="${i}">&times;</button>
        </div>
        <div class="admin-form-grid">
          ${field({ name:`source_${i}_name`, label:'Name', value:s.name || '' })}
          ${field({ name:`source_${i}_url`, label:'URL', value:s.url || '', type:'url' })}
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-del-source]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = parseInt(b.dataset.delSource);
        const ok = await confirmDialog({ title: 'Delete Source?', message: 'This official reference will be removed.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        items.splice(idx, 1); renderSources(items); setDirty(true);
      });
    });
  }

  function renderRelated(items) {
    const el = document.getElementById('related-picker');
    const selected = new Set(items);
    el.innerHTML = `
      <input class="admin-input admin-search" id="related-search" placeholder="Search services..." type="search">
      <div class="admin-related-list" id="related-list">${renderRelatedItems()}</div>`;
    el.querySelector('#related-search').addEventListener('input', () => {
      const term = el.querySelector('#related-search').value.toLowerCase();
      el.querySelector('#related-list').innerHTML = renderRelatedItems(term);
    });
    function renderRelatedItems(term = '') {
      const filtered = allServices.filter(s => !term || (s.name_en||'').toLowerCase().includes(term) || (s.name_ne||'').includes(term));
      if (!filtered.length) return '<div class="admin-empty"><p>No matching services.</p></div>';
      return filtered.map(s => `
        <label class="admin-checkbox admin-related-item">
          <input type="checkbox" value="${esc(s.id)}" ${selected.has(s.id) ? 'checked' : ''}> ${esc(s.name_en)} <span style="color:var(--text-tertiary);font-size:var(--text-xs)">${esc(s.name_ne)}</span>
        </label>`).join('');
    }
    el.querySelector('#related-list').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const id = e.target.value;
        if (e.target.checked) selected.add(id); else selected.delete(id);
        setDirty(true);
      }
    });
  }

  // Save handler
  container.querySelector('#svc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await save(isNew ? null : s.id, 'published');
  });
  container.querySelector('#svc-save-draft').addEventListener('click', async () => {
    await save(isNew ? null : s.id, 'draft');
  });

  async function save(existingId, status) {
    const data = getFormData(document.getElementById('svc-form'));

    // Validate
    if (!data.name_en.trim()) { showToast('Please enter the English service name.', 'error'); return; }
    if (!data.name_ne.trim()) { showToast('कृपया नेपाली सेवाको नाम लेख्नुहोस्।', 'error'); return; }
    if (!data.id.trim()) { showToast('Please enter a Service ID (slug).', 'error'); return; }

    // Build nested structures
    const stepsArr = steps.map((st, i) => ({
      title: { en: data[`step_${i}_title_en`] || '', ne: data[`step_${i}_title_ne`] || '' },
      description: { en: data[`step_${i}_desc_en`] || '', ne: data[`step_${i}_desc_ne`] || '' },
    })).filter(st => st.title.en || st.title.ne || st.description.en || st.description.ne);

    const docsArr = docs.map((d, i) => ({
      name: { en: data[`doc_${i}_name_en`] || '', ne: data[`doc_${i}_name_ne`] || '' },
      required: d.required !== false,
    })).filter(d => d.name.en || d.name.ne);

    const mistakesArr = mistakes.map((m, i) => ({ en: data[`mistake_${i}_en`] || '', ne: data[`mistake_${i}_ne`] || '' })).filter(m => m.en || m.ne);
    const tipsArr = tips.map((tip, i) => ({ en: data[`tip_${i}_en`] || '', ne: data[`tip_${i}_ne`] || '' })).filter(t => t.en || t.ne);
    const sourcesArr = sources.map((src, i) => ({
      name: data[`source_${i}_name`] || '', url: data[`source_${i}_url`] || '',
    })).filter(s => s.name || s.url);
    const relatedArr = [...selected];
    const officesArr = s.offices || [];

    const row = {
      id: data.id.trim(),
      name_en: data.name_en, name_ne: data.name_ne,
      description_en: data.description_en, description_ne: data.description_ne,
      category: data.category || 'other', sub_category: data.sub_category || null,
      icon: data.icon || 'description',
      popular: !!data.popular, online_available: !!data.online_available,
      keywords: (data.keywords || '').split(',').map(k => k.trim()).filter(Boolean),
      department_id: data.department_id || null,
      offices: officesArr,
      steps: stepsArr, documents: docsArr, common_mistakes: mistakesArr,
      tips: tipsArr, related_services: relatedArr, official_sources: sourcesArr,
      fees_summary_en: data.fees_summary_en || null, fees_summary_ne: data.fees_summary_ne || null,
      processing_standard_days: data.processing_standard_days ? Number(data.processing_standard_days) : null,
      processing_express_days: data.processing_express_days ? Number(data.processing_express_days) : null,
      processing_max_days: data.processing_max_days ? Number(data.processing_max_days) : null,
      processing_note_en: data.processing_note_en || null, processing_note_ne: data.processing_note_ne || null,
      last_updated: data.last_updated || new Date().toISOString().slice(0, 10),
      status,
      published_at: status === 'published' ? new Date().toISOString() : (s.published_at || null),
    };

    try {
      if (existingId) {
        await db.update('services', existingId, row);
        await db.logAction(status === 'published' ? 'published' : 'updated', 'Service', existingId);
        showToast(status === 'published' ? 'Service published!' : 'Draft saved.', 'success');
      } else {
        // Check for duplicate id
        const { data: existing } = await from('services').select('id').eq('id', row.id).single().catch(() => ({}));
        if (existing) {
          showToast('A service with this ID already exists. Please choose a different slug.', 'error');
          return;
        }
        const created = await db.insert('services', row);
        await db.logAction(status === 'published' ? 'created' : 'created', 'Service', created.id);
        showToast(status === 'published' ? 'Service created and published!' : 'Draft saved.', 'success');
      }
      setDirty(false);
      nav('services');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  }

  // Delete
  container.querySelector('#svc-delete')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Delete Service?',
      message: `Delete "${s.id}"? This action cannot be easily undone.`,
      confirmText: 'Delete', danger: true,
    });
    if (!ok) return;
    try {
      await db.remove('services', s.id);
      await db.logAction('deleted', 'Service', s.id);
      showToast('Service deleted.', 'success');
      setDirty(false);
      nav('services');
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  });
}
