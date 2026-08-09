
import { renderList as renderListCrud, renderEditor as renderEditorCrud } from '../crud.js';

const COLS = [
  { key: 'question_en', label: 'Question (EN)' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status', render: r => `<span class="tag tag--${r.status==='published'?'success':'warning'}">${r.status}</span>` },
];

const CATEGORIES = ['citizenship','passport','driving_license','land','birth_registration','marriage','general'];

export async function renderList(c) {
  renderListCrud(c, { table: 'faqs', title: 'FAQs', icon: 'help', columns: COLS, searchFields: ['question_en','question_ne','answer_en'], route: 'faqs', singular: 'FAQ' });
}

export async function renderEdit(c, id) {
  renderEditorCrud(c, {
    table: 'faqs', title: 'FAQs', route: 'faqs', singular: 'FAQ',
    fields: [
      { name: 'id', label: 'ID (number)', type: 'number', help: 'Optional — leave blank to auto-generate.' },
      { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map(c=>[c,c]), required: true },
      { name: 'question', type: 'bilingual', label: 'Question', enLabel: 'Question (English)', neLabel: 'प्रश्न (नेपाली)', inputType: 'textarea', required: true },
      { name: 'answer', type: 'bilingual', label: 'Answer', enLabel: 'Answer (English)', neLabel: 'उत्तर (नेपाली)', inputType: 'textarea', required: true },
      { name: 'keywords', label: 'Keywords', help: 'Comma-separated keywords for search' },
      { name: 'sort_order', label: 'Sort Order', type: 'number' },
      { name: 'status', type: 'select', label: 'Status', options: [['draft','Draft'],['published','Published']], required: true },
    ],
    mapToDb: (data) => {
      const row = { category: data.category,
      question_en: data.question_en, question_ne: data.question_ne,
      answer_en: data.answer_en, answer_ne: data.answer_ne,
      keywords: data.keywords ? data.keywords.split(',').map(s=>s.trim()).filter(Boolean) : [],
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      status: data.status };
      if (data.id !== '' && data.id != null) row.id = Number(data.id);
      return row;
    },
  }, id);
}
