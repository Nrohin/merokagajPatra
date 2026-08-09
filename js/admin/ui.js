
// ── Toast notifications ─────────────────────────────────────
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<span class="material-symbols-rounded">${icons[type] || 'info'}</span><span>${esc(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Confirm dialog ──────────────────────────────────────────
export function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h3>${esc(title)}</h3>
          <button class="admin-icon-btn admin-modal-close">&times;</button>
        </div>
        <div class="admin-modal-body"><p>${esc(message)}</p></div>
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn--secondary admin-cancel">Cancel</button>
          <button class="admin-btn ${danger ? 'admin-btn--danger' : 'admin-btn--primary'} admin-confirm">${esc(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = (val) => { overlay.remove(); resolve(val); };
    overlay.querySelector('.admin-modal-close').onclick = () => close(false);
    overlay.querySelector('.admin-cancel').onclick = () => close(false);
    overlay.querySelector('.admin-confirm').onclick = () => close(true);
    overlay.onclick = (e) => { if (e.target === overlay) close(false); };
  });
}

// ── Modal ───────────────────────────────────────────────────
export function showModal(title, bodyHtml, opts = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal${opts.wide ? ' admin-modal--wide' : ''}">
      <div class="admin-modal-header">
        <h3>${esc(title)}</h3>
        <button class="admin-icon-btn admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">${bodyHtml}</div>
      ${opts.footer ? `<div class="admin-modal-footer">${opts.footer}</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.admin-modal-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  return { close: () => overlay.remove(), el: overlay };
}

// ── Form field helpers ──────────────────────────────────────
export function field({ name, label, type = 'text', value = '', required = false, help = '', placeholder = '' }) {
  const id = `field-${name}`;
  const val = value == null ? '' : value;
  let input;
  if (type === 'textarea') {
    input = `<textarea class="admin-input" id="${id}" name="${name}" rows="3" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}>${esc(val)}</textarea>`;
  } else if (type === 'select') {
    input = `<select class="admin-input" id="${id}" name="${name}" ${required ? 'required' : ''}>
      <option value="">-- Select --</option>
    </select>`;
  } else if (type === 'checkbox') {
    input = `<label class="admin-checkbox"><input type="checkbox" id="${id}" name="${name}" ${val ? 'checked' : ''}> ${esc(label)}</label>`;
    return `<div class="admin-field">${input}${help ? `<small class="admin-help">${esc(help)}</small>` : ''}</div>`;
  } else if (type === 'number') {
    input = `<input class="admin-input" type="number" id="${id}" name="${name}" value="${esc(val)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}>`;
  } else {
    input = `<input class="admin-input" type="${type}" id="${id}" name="${name}" value="${esc(val)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}>`;
  }
  return `<div class="admin-field">
    <label class="admin-label" for="${id}">${esc(label)}${required ? ' <span class="admin-required">*</span>' : ''}</label>
    ${input}
    ${help ? `<small class="admin-help">${help}</small>` : ''}
  </div>`;
}

export function selectField({ name, label, value, options, required = false }) {
  const opts = options.map(o => {
    const [val, lbl] = typeof o === 'string' ? [o, o] : [o.value, o.label];
    return `<option value="${esc(val)}" ${val === value ? 'selected' : ''}>${esc(lbl)}</option>`;
  }).join('');
  return `<div class="admin-field">
    <label class="admin-label" for="field-${name}">${esc(label)}${required ? ' <span class="admin-required">*</span>' : ''}</label>
    <select class="admin-input" id="field-${name}" name="${name}" ${required ? 'required' : ''}>
      <option value="">-- Select --</option>${opts}
    </select>
  </div>`;
}

export function bilingualField({ enName, neName, enLabel, neLabel, enValue = '', neValue = '', type = 'input', required = false, help = '' }) {
  const enId = `field-${enName}`;
  const neId = `field-${neName}`;
  const makeInput = (id, val) => type === 'textarea'
    ? `<textarea class="admin-input" id="${id}" name="${id.replace('field-','')}" rows="3">${esc(val)}</textarea>`
    : `<input class="admin-input" type="${type}" id="${id}" name="${id.replace('field-','')}" value="${esc(val)}">`;
  return `<div class="admin-bilingual">
    <div class="admin-bilingual-col">
      <label class="admin-label" for="${enId}">🇬🇧 ${esc(enLabel)}${required ? ' <span class="admin-required">*</span>' : ''}</label>
      ${makeInput(enId, enValue)}
    </div>
    <div class="admin-bilingual-col">
      <label class="admin-label" for="${neId}">🇳🇵 ${esc(neLabel)}${required ? ' <span class="admin-required">*</span>' : ''}</label>
      ${makeInput(neId, neValue)}
    </div>
  </div>
  ${help ? `<small class="admin-help">${help}</small>` : ''}`;
}

// ── Table helpers ───────────────────────────────────────────
export function dataTable(columns, rows, actions) {
  if (!rows?.length) return '<div class="admin-empty"><span class="material-symbols-rounded">inbox</span><p>No items found.</p></div>';
  const thead = columns.map(c => `<th>${esc(c.label)}</th>`).join('');
  const tbody = rows.map(row => {
    const cells = columns.map(c => `<td>${c.render ? c.render(row) : esc(String(row[c.key] || ''))}</td>`).join('');
    const actHtml = actions ? `<td class="admin-table-actions">${actions(row)}</td>` : '';
    return `<tr>${cells}${actHtml}</tr>`;
  }).join('');
  return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${thead}${actions ? '<th style="width:120px">Actions</th>' : ''}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

// ── Escape HTML ─────────────────────────────────────────────
export function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Form data extraction ────────────────────────────────────
export function getFormData(form) {
  const fd = new FormData(form);
  const data = {};
  for (const [k, v] of fd.entries()) {
    data[k] = v;
  }
  // Handle checkboxes
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    data[cb.name] = cb.checked;
  });
  return data;
}

// ── Unsaved changes warning ─────────────────────────────────
let _dirty = false;
let _dirtyMsg = 'You have unsaved changes. Leave without saving?';
export function setDirty(d) { _dirty = d; }
export function isDirty() { return _dirty; }
export function warnUnsaved(e) { if (_dirty) { e.preventDefault(); e.returnValue = _dirtyMsg; } }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', warnUnsaved);
}
