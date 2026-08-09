
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'province', label: 'Province' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

const PROVINCES = ['Koshi Province','Madhesh Province','Bagmati Province','Gandaki Province','Lumbini Province','Karnali Province','Sudurpashchim Province'];

export async function renderList(c) {
  renderListCrud(c, { table: 'offices', title: 'Offices', icon: 'location_on', columns: COLS, searchFields: ['name_en','name_ne','province'], route: 'offices', singular: 'Office' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'offices', title: 'Offices', route: 'offices', singular: 'Office',
    fields: [
      { name: 'id', label: 'ID (slug)', required: true },
      { name: 'name', type: 'bilingual', label: 'Name', enLabel: 'Name (English)', neLabel: 'नाम (नेपाली)', required: true },
      { name: 'address', type: 'bilingual', label: 'Address', enLabel: 'Address (English)', neLabel: 'ठेगाना (नेपाली)', inputType: 'textarea' },
      { name: 'phone', label: 'Phone Number' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'hours', type: 'bilingual', label: 'Opening Hours', enLabel: 'Hours (English)', neLabel: 'समय (नेपाली)' },
      { name: 'best_time', type: 'bilingual', label: 'Best Time to Visit', enLabel: 'Best Time (English)', neLabel: 'बेला (नेपाली)' },
      { name: 'province', label: 'Province', type: 'select', options: PROVINCES.map(p=>[p,p]) },
      { name: 'map_url', label: 'Google Maps URL' },
      { name: 'services', label: 'Service IDs', help: 'Comma-separated service IDs' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id,
      name_en: data.name_en, name_ne: data.name_ne,
      address: { en: data.address_en || '', ne: data.address_ne || '' },
      phone: data.phone || null, email: data.email || null,
      hours: { en: data.hours_en || '', ne: data.hours_ne || '' },
      best_time: { en: data.best_time_en || '', ne: data.best_time_ne || '' },
      province: data.province || 'Bagmati Province',
      map_url: data.map_url || null,
      services: data.services ? data.services.split(',').map(s=>s.trim()).filter(Boolean) : [],
      status: data.status,
    }),
  }, id);
}
