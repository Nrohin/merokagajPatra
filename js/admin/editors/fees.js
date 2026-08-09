
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'service_id', label: 'Service ID' },
  { key: 'type_en', label: 'Fee Type (EN)' },
  { key: 'amount', label: 'Amount (NPR)' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'fees', title: 'Fee Schedules', icon: 'payments', columns: COLS, searchFields: ['service_id','type_en','type_ne'], route: 'fees', singular: 'Fee' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'fees', title: 'Fees', route: 'fees', singular: 'Fee',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'service_id', label: 'Service ID', required: true },
      { name: 'type_en', label: 'Fee Type (English)', required: true },
      { name: 'type_ne', label: 'शुल्कको प्रकार (नेपाली)', required: true },
      { name: 'amount', label: 'Amount (NPR)', type: 'number' },
      { name: 'note_en', label: 'Note (English)', inputType: 'textarea' },
      { name: 'note_ne', label: 'टिप्पणी (नेपाली)', inputType: 'textarea' },
      { name: 'sort_order', label: 'Sort Order', type: 'number' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id, service_id: data.service_id,
      type_en: data.type_en, type_ne: data.type_ne,
      amount: data.amount ? Number(data.amount) : null,
      note_en: data.note_en || null, note_ne: data.note_ne || null,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      status: data.status,
    }),
  }, id);
}
