#!/usr/bin/env node
/**
 * MeroKagaj — JSON → Supabase Import Script
 *
 * Reads the existing data/*.json files and upserts them into Supabase,
 * preserving existing IDs/slugs (URL compatibility) and setting status='published'.
 *
 * Requirements:
 *   - Node 18+ (has global fetch)
 *   - Env vars:
 *       SUPABASE_URL=https://your-project.supabase.co
 *       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *
 * Usage:
 *   export SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   node supabase/seed/import.mjs
 *
 * The service-role key is used ONLY server-side in this script — never in the browser.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

// Auto-load supabase/.env.local if present (gitignored — holds your secrets).
// Explicit shell env vars always win over the file.
function loadDotEnv(file) {
  try {
    if (!existsSync(file)) return;
    const text = readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* ignore malformed env file */ }
}
loadDotEnv(path.resolve(__dirname, '../.env.local'));
loadDotEnv(path.resolve(__dirname, '../.env'));

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  console.error('  export SUPABASE_URL=https://your-project.supabase.co');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const API = `${SUPABASE_URL}/rest/v1`;

async function request(table, method, body, onConflict) {
  let url = `${API}/${table}`;
  const params = new URLSearchParams();
  if (onConflict) params.set('on_conflict', onConflict);
  const qs = params.toString();
  if (qs) url += '?' + qs;

  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${table}] ${method} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return [];
  return res.json();
}

async function loadJSON(file) {
  return JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf-8'));
}

// ── Mappers: JSON shape → DB columns ────────────────────────

function mapService(s) {
  return {
    id: s.id,
    name_en: s.name?.en || '', name_ne: s.name?.ne || '',
    description_en: s.description?.en || '', description_ne: s.description?.ne || '',
    category: s.category || 'other', sub_category: s.subCategory || null,
    icon: s.icon || 'description', popular: !!s.popular,
    online_available: !!s.onlineAvailable,
    keywords: s.keywords || [],
    department_id: s.departmentId || null,
    offices: s.offices || [],
    steps: s.steps || [],
    documents: s.documents || [],
    common_mistakes: s.commonMistakes || [],
    tips: s.tips || [],
    related_services: s.relatedServices || [],
    official_sources: s.officialSources || [],
    fees_summary_en: s.fees?.en || null, fees_summary_ne: s.fees?.ne || null,
    processing_standard_days: s.processing?.standardDays ?? null,
    processing_express_days: s.processing?.expressDays ?? null,
    processing_max_days: s.processing?.maxDays ?? null,
    processing_note_en: s.processing?.note?.en || null,
    processing_note_ne: s.processing?.note?.ne || null,
    last_updated: s.lastUpdated || new Date().toISOString().slice(0, 10),
    status: 'published',
  };
}

function mapDepartment(d) {
  return {
    id: d.id,
    name_en: d.name?.en || '', name_ne: d.name?.ne || '',
    description_en: d.description?.en || '', description_ne: d.description?.ne || '',
    website: d.website || null, phone: d.phone || null, email: d.email || null,
    services: d.services || [],
    status: 'published',
  };
}

function mapOffice(o) {
  return {
    id: o.id,
    name_en: o.name?.en || '', name_ne: o.name?.ne || '',
    address: o.address || { en: '', ne: '' },
    phone: o.phone || null, email: o.email || null,
    hours: o.hours || { en: '', ne: '' },
    best_time: o.bestTime || { en: '', ne: '' },
    province: o.province || 'Bagmati', map_url: o.mapUrl || null,
    services: o.services || [],
    status: 'published',
  };
}

function mapDao(d) {
  return {
    id: d.id,
    name_en: d.name?.en || '', name_ne: d.name?.ne || '',
    district: d.district || null, headquarters: d.headquarters || null,
    province: d.province || 'Bagmati',
    website: d.website || null, phone: d.phone || null,
    hours: d.hours || { en: '', ne: '' },
    best_time: d.bestTime || { en: '', ne: '' },
    services: d.services || [], map_url: d.mapUrl || null,
    status: 'published',
  };
}

function mapForm(f) {
  return {
    id: f.id, service_id: f.serviceId,
    name_en: f.name?.en || '', name_ne: f.name?.ne || '',
    format: f.format || null, url: f.url || null,
    status: 'published',
  };
}

function mapFee(f, index) {
  return {
    id: `fee-${f.serviceId}-${index}`, service_id: f.serviceId,
    type_en: f.type?.en || '', type_ne: f.type?.ne || '',
    amount: f.amount ?? null,
    note_en: f.note?.en || null, note_ne: f.note?.ne || null,
    sort_order: index, status: 'published',
  };
}

function mapProcessing(p) {
  return {
    id: `proc-${p.serviceId}`, service_id: p.serviceId,
    standard_days: p.standardDays ?? null, express_days: p.expressDays ?? null,
    max_days: p.maxDays ?? null,
    note_en: p.note?.en || null, note_ne: p.note?.ne || null,
    status: 'published',
  };
}

function mapFaq(f) {
  return {
    id: f.id, category: f.category || 'general',
    question_en: f.question?.en || '', question_ne: f.question?.ne || '',
    answer_en: f.answer?.en || '', answer_ne: f.answer?.ne || '',
    keywords: f.keywords || [], sort_order: 0, status: 'published',
  };
}

function mapGlossary(g) {
  return {
    id: g.id,
    term_en: g.term?.en || '', term_ne: g.term?.ne || '',
    definition_en: g.definition?.en || '', definition_ne: g.definition?.ne || '',
    sort_order: 0, status: 'published',
  };
}

function mapEmergency(e) {
  return {
    id: e.id,
    name_en: e.name?.en || '', name_ne: e.name?.ne || '',
    number: e.number, icon: e.icon || null,
    description_en: e.description?.en || null, description_ne: e.description?.ne || null,
    category: null, is_active: true, sort_order: 0, status: 'published',
  };
}

function mapNews(n) {
  return {
    id: n.id,
    title_en: n.title?.en || '', title_ne: n.title?.ne || '',
    summary_en: n.summary?.en || '', summary_ne: n.summary?.ne || '',
    body_en: n.body?.en || '', body_ne: n.body?.ne || '',
    date: n.date || null, category: n.category || null, source: n.source || null,
    status: 'published',
  };
}

function mapLifeEvent(le) {
  return {
    id: le.id,
    name_en: le.name?.en || '', name_ne: le.name?.ne || '',
    description_en: le.description?.en || '', description_ne: le.description?.ne || '',
    icon: le.icon || null,
    services: le.services || [],
    tips: le.tips || [], keywords: le.keywords || [],
    sort_order: 0, status: 'published',
  };
}

function mapTranslation(en, ne) {
  const keys = new Set([...Object.keys(en), ...Object.keys(ne)]);
  return [...keys].map(k => ({ key: k, en: en[k] || '', ne: ne[k] || '' }));
}

// ── Run ─────────────────────────────────────────────────────

async function upsert(table, rows, onConflict = 'id') {
  if (!rows.length) { console.log(`  ${table}: 0 rows (skipped)`); return; }
  const chunks = [];
  for (let i = 0; i < rows.length; i += 100) chunks.push(rows.slice(i, i + 100));
  for (const chunk of chunks) {
    await request(table, 'POST', chunk, onConflict);
  }
  console.log(`  ${table}: upserted ${rows.length}`);
}

async function main() {
  console.log('═ MeroKagaj JSON → Supabase Import ═\n');
  console.log(`Data directory: ${DATA_DIR}\n`);

  // Services (and dependent tables first for FK clarity — no strict FK enforced, but logical)
  const services = (await loadJSON('services.json')).map(mapService);
  const departments = (await loadJSON('departments.json')).map(mapDepartment);
  const offices = (await loadJSON('offices.json')).map(mapOffice);
  const daos = (await loadJSON('dao.json')).map(mapDao);
  const forms = (await loadJSON('forms.json')).map(mapForm);
  const fees = (await loadJSON('fees.json')).map(mapFee);
  const processing = (await loadJSON('processing.json')).map(mapProcessing);
  const faqs = (await loadJSON('faq.json')).map(mapFaq);
  const glossary = (await loadJSON('glossary.json')).map(mapGlossary);
  const emergency = (await loadJSON('emergency.json')).map(mapEmergency);
  const news = (await loadJSON('news.json')).map(mapNews);
  const lifeEvents = (await loadJSON('life-events.json')).map(mapLifeEvent);
  const en = await loadJSON('translations/en.json');
  const ne = await loadJSON('translations/ne.json');
  const translations = mapTranslation(en, ne);

  const tasks = [
    ['departments', departments],
    ['services', services],
    ['offices', offices],
    ['dao_offices', daos],
    ['forms', forms],
    ['fees', fees],
    ['processing_times', processing],
    ['faqs', faqs],
    ['glossary', glossary],
    ['emergency_numbers', emergency],
    ['news', news],
    ['life_events', lifeEvents],
    ['translations', translations],
  ];

  for (const [table, rows] of tasks) {
    console.log(`Importing ${table}...`);
    try {
      await upsert(table, rows, table === 'translations' ? 'key' : 'id');
    } catch (err) {
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }

  console.log('\n═ Import complete ═');
  console.log('Tip: set the role of your first admin:');
  console.log('  UPDATE public.profiles SET role = \'super_admin\' WHERE email = \'your@email.com\';');
}

main().catch(err => { console.error(err); process.exit(1); });
