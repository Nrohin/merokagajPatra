
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'title_en', label: 'Title (EN)' },
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

const CATEGORIES = ['Update','New Feature','Service Update','Policy Change','Notice'];

export async function renderList(c) {
  renderListCrud(c, { table: 'news', title: 'News Articles', icon: 'newspaper', columns: COLS, searchFields: ['title_en','title_ne','summary_en'], route: 'news', singular: 'News Article' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'news', title: 'News', route: 'news', singular: 'News Article',
    fields: [
      { name: 'title', type: 'bilingual', label: 'Title', enLabel: 'Title (English)', neLabel: 'शीर्षक (नेपाली)', required: true },
      { name: 'summary', type: 'bilingual', label: 'Summary', enLabel: 'Summary (English)', neLabel: 'सारांश (नेपाली)', inputType: 'textarea', required: true },
      { name: 'body', type: 'bilingual', label: 'Body', enLabel: 'Body (English)', neLabel: 'विवरण (नेपाली)', inputType: 'textarea' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map(c=>[c,c]) },
      { name: 'source', label: 'Source URL' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => ({
      title_en: data.title_en, title_ne: data.title_ne,
      summary_en: data.summary_en, summary_ne: data.summary_ne,
      body_en: data.body_en || '', body_ne: data.body_ne || '',
      date: data.date || null, category: data.category || null,
      source: data.source || null,
      status: data.status,
    }),
  }, id);
}
