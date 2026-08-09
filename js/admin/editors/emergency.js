
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'number', label: 'Number' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'emergency_numbers', title: 'Emergency Numbers', icon: 'emergency', columns: COLS, searchFields: ['name_en','name_ne','number'], route: 'emergency', singular: 'Emergency Number' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'emergency_numbers', title: 'Emergency Numbers', route: 'emergency', singular: 'Emergency Number',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', type: 'bilingual', label: 'Name', enLabel: 'Name (English)', neLabel: 'नाम (नेपाली)', required: true },
      { name: 'number', label: 'Phone Number', required: true },
      { name: 'icon', label: 'Icon', help: 'Material Symbols icon name' },
      { name: 'description', type: 'bilingual', label: 'Description', enLabel: 'Description (English)', neLabel: 'विवरण (नेपाली)', inputType: 'textarea' },
      { name: 'category', label: 'Category' },
      { name: 'sort_order', label: 'Sort Order', type: 'number' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id,
      name_en: data.name_en, name_ne: data.name_ne,
      number: data.number, icon: data.icon || null,
      description_en: data.description_en || null, description_ne: data.description_ne || null,
      category: data.category || null,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      status: data.status,
    }),
  }, id);
}
