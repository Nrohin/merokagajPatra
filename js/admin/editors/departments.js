
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'name_ne', label: 'Name (NE)' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

const FIELDS = [
  { name: 'id', label: 'ID (slug)', required: true, help: 'Unique identifier. Use lowercase hyphens (e.g., "doi").' },
  { name: 'name', type: 'bilingual', label: 'Name', enLabel: 'Name (English)', neLabel: 'नाम (नेपाली)', required: true },
  { name: 'description', type: 'bilingual', label: 'Description', enLabel: 'Description (English)', neLabel: 'विवरण (नेपाली)', inputType: 'textarea' },
  { name: 'website', label: 'Website URL' },
  { name: 'phone', label: 'Phone Number' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'services', label: 'Service IDs', help: 'Comma-separated service IDs (e.g., "citizenship-by-descent, national-id")' },
  { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'departments', title: 'Departments', icon: 'account_balance', columns: COLS, searchFields: ['name_en','name_ne'], route: 'departments', singular: 'Department' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'departments', title: 'Departments', route: 'departments', singular: 'Department',
    fields: FIELDS,
    mapToDb: (data) => ({
      id: data.id,
      name_en: data.name_en, name_ne: data.name_ne,
      description_en: data.description_en, description_ne: data.description_ne,
      website: data.website || null, phone: data.phone || null, email: data.email || null,
      services: data.services ? data.services.split(',').map(s=>s.trim()).filter(Boolean) : [],
      status: data.status,
    }),
  }, id);
}
