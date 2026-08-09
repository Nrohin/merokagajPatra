
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'service_id', label: 'Service ID' },
  { key: 'standard_days', label: 'Standard (days)' },
  { key: 'max_days', label: 'Max (days)' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'processing_times', title: 'Processing Times', icon: 'schedule', columns: COLS, searchFields: ['service_id'], route: 'processing', singular: 'Processing Time' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'processing_times', title: 'Processing Times', route: 'processing', singular: 'Processing Time',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'service_id', label: 'Service ID', required: true },
      { name: 'standard_days', label: 'Standard Days', type: 'number' },
      { name: 'express_days', label: 'Express Days', type: 'number' },
      { name: 'max_days', label: 'Maximum Days', type: 'number' },
      { name: 'note_en', label: 'Note (English)', inputType: 'textarea' },
      { name: 'note_ne', label: 'टिप्पणी (नेपाली)', inputType: 'textarea' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id, service_id: data.service_id,
      standard_days: data.standard_days ? Number(data.standard_days) : null,
      express_days: data.express_days ? Number(data.express_days) : null,
      max_days: data.max_days ? Number(data.max_days) : null,
      note_en: data.note_en || null, note_ne: data.note_ne || null,
      status: data.status,
    }),
  }, id);
}
