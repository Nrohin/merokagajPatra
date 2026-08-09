
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'name_en', label: 'Name (EN)' },
  { key: 'icon', label: 'Icon' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'life_events', title: 'Life Events', icon: 'celebration', columns: COLS, searchFields: ['name_en','name_ne','description_en'], route: 'life-events', singular: 'Life Event' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'life_events', title: 'Life Events', route: 'life-events', singular: 'Life Event',
    fields: [
      { name: 'id', label: 'ID', required: true },
      { name: 'name', type: 'bilingual', label: 'Name', enLabel: 'Name (English)', neLabel: 'नाम (नेपाली)', required: true },
      { name: 'description', type: 'bilingual', label: 'Description', enLabel: 'Description (English)', neLabel: 'विवरण (नेपाली)', inputType: 'textarea', required: true },
      { name: 'icon', label: 'Icon', help: 'Material Symbols icon name' },
      { name: 'services', label: 'Service IDs', help: 'Comma-separated service IDs' },
      { name: 'tips', label: 'Tips (JSON)', inputType: 'textarea', help: 'JSON array, e.g. [{"en":"Tip 1","ne":"सुझाव १"}]' },
      { name: 'keywords', label: 'Keywords', help: 'Comma-separated' },
      { name: 'sort_order', label: 'Sort Order', type: 'number' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => {
      let tips = [];
      try { tips = data.tips ? JSON.parse(data.tips) : []; } catch {}
      return {
        id: data.id,
        name_en: data.name_en, name_ne: data.name_ne,
        description_en: data.description_en, description_ne: data.description_ne,
        icon: data.icon || null,
        services: data.services ? data.services.split(',').map(s=>s.trim()).filter(Boolean) : [],
        tips, keywords: data.keywords ? data.keywords.split(',').map(s=>s.trim()).filter(Boolean) : [],
        sort_order: data.sort_order ? Number(data.sort_order) : 0,
        status: data.status,
      };
    },
  }, id);
}
