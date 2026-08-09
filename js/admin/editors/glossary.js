
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'term_en', label: 'Term (EN)' },
  { key: 'term_ne', label: 'Term (NE)' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

export async function renderList(c) {
  renderListCrud(c, { table: 'glossary', title: 'Glossary', icon: 'menu_book', columns: COLS, searchFields: ['term_en','term_ne','definition_en'], route: 'glossary', singular: 'Glossary Term' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'glossary', title: 'Glossary', route: 'glossary', singular: 'Glossary Term',
    fields: [
      { name: 'id', label: 'ID (slug)', required: true },
      { name: 'term', type: 'bilingual', label: 'Term', enLabel: 'Term (English)', neLabel: 'शब्द (नेपाली)', required: true },
      { name: 'definition', type: 'bilingual', label: 'Definition', enLabel: 'Definition (English)', neLabel: 'परिभाषा (नेपाली)', inputType: 'textarea', required: true },
      { name: 'sort_order', label: 'Sort Order', type: 'number' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      id: data.id,
      term_en: data.term_en, term_ne: data.term_ne,
      definition_en: data.definition_en, definition_ne: data.definition_ne,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      status: data.status,
    }),
  }, id);
}
