
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'service_id', label: 'Service ID' },
  { key: 'format', label: 'Format' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'forms', title: 'Official Forms', icon: 'description', columns: COLS, searchFields: ['name_en','name_ne','service_id'], route: 'forms', singular: 'Form' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'forms', title: 'Forms', route: 'forms', singular: 'Form',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'service_id', label: 'Service ID', required: true, help: 'ID of the related service' },
      { name: 'name', type: 'bilingual', label: 'Form Name', enLabel: 'Name (EN)', neLabel: 'नाम (NE)', required: true },
      { name: 'format', label: 'Format', help: 'e.g., pdf, docx' },
      { name: 'url', label: 'Download URL' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id, service_id: data.service_id,
      name_en: data.name_en, name_ne: data.name_ne,
      format: data.format || null, url: data.url || null,
      status: data.status,
    }),
  }, id);
}
