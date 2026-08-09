
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'district', label: 'District' },
  { key: 'province', label: 'Province' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

const PROVINCES = ['Koshi Province','Madhesh Province','Bagmati Province','Gandaki Province','Lumbini Province','Karnali Province','Sudurpashchim Province'];

export async function renderList(c) {
  renderListCrud(c, { table: 'dao_offices', title: 'District Admin Offices (DAO)', icon: 'domain', columns: COLS, searchFields: ['name_en','name_ne','district','province'], route: 'dao-offices', singular: 'DAO Office' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'dao_offices', title: 'DAO Offices', route: 'dao-offices', singular: 'DAO Office',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', type: 'bilingual', label: 'Name', enLabel: 'Name (English)', neLabel: 'नाम (नेपाली)', required: true },
      { name: 'district', label: 'District' },
      { name: 'headquarters', label: 'Headquarters' },
      { name: 'province', label: 'Province', type: 'select', options: PROVINCES.map(p=>[p,p]) },
      { name: 'website', label: 'Website URL' },
      { name: 'phone', label: 'Phone' },
      { name: 'hours', type: 'bilingual', label: 'Opening Hours', enLabel: 'Hours (EN)', neLabel: 'समय (NE)' },
      { name: 'best_time', type: 'bilingual', label: 'Best Time', enLabel: 'Best Time (EN)', neLabel: 'बेला (NE)' },
      { name: 'map_url', label: 'Maps URL' },
      { name: 'services', label: 'Service IDs', help: 'Comma-separated' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id,
      name_en: data.name_en, name_ne: data.name_ne,
      district: data.district || null, headquarters: data.headquarters || null,
      province: data.province || 'Bagmati Province',
      website: data.website || null, phone: data.phone || null,
      hours: { en: data.hours_en || '', ne: data.hours_ne || '' },
      best_time: { en: data.best_time_en || '', ne: data.best_time_ne || '' },
      map_url: data.map_url || null,
      services: data.services ? data.services.split(',').map(s=>s.trim()).filter(Boolean) : [],
      status: data.status,
    }),
  }, id);
}
