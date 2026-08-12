
/**
 * MeroKagaj — Data Layer
 * Intercepts fetch() for data/*.json to serve Supabase content when configured.
 * Falls back to local JSON files if Supabase is unavailable or unconfigured.
 * No page changes required — transparent to existing code.
 */

import { CONFIG, isSupabaseConfigured } from './config.js';
import { initClient, from as pgFrom } from './supabase.js';

let _ready = false;
const _providers = new Map(); // normalizedUrl → async () => data
const _originalFetch = window.fetch.bind(window);

// ══════════════════════════════════════════════════════════════
// Initialization
// ══════════════════════════════════════════════════════════════

export async function initDataLayer() {
  if (!isSupabaseConfigured()) return; // No Supabase → use files as-is

  initClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  // Register providers for each data file (keys are normalized paths — leading slash)
  registerProvider('/data/services.json', hydrateServices);
  registerProvider('/data/departments.json', hydrateTable('departments', mapDepartment));
  registerProvider('/data/offices.json', hydrateTable('offices', mapOffice));
  registerProvider('/data/dao.json', hydrateTable('dao_offices', mapDaoOffice));
  registerProvider('/data/forms.json', hydrateTable('forms', mapForm));
  // NOTE: the order column must EXIST in the table. Tables without a name_en
  // column (fees, processing_times, faqs, glossary, news) must order by a
  // column they actually have — otherwise PostgREST returns an error and the
  // provider falls back to the local JSON file (stale content).
  registerProvider('/data/fees.json', hydrateTable('fees', mapFee, 'sort_order'));
  registerProvider('/data/processing.json', hydrateTable('processing_times', mapProcessing, 'id'));
  registerProvider('/data/faq.json', hydrateTable('faqs', mapFaq, 'sort_order'));
  registerProvider('/data/glossary.json', hydrateTable('glossary', mapGlossary, 'term_en'));
  registerProvider('/data/emergency.json', hydrateTable('emergency_numbers', mapEmergency));
  registerProvider('/data/news.json', hydrateTable('news', mapNews, 'date', false));
  registerProvider('/data/life-events.json', hydrateTable('life_events', mapLifeEvent));
  registerProvider('/data/translations/en.json', () => hydrateTranslations('en'));
  registerProvider('/data/translations/ne.json', () => hydrateTranslations('ne'));

  patchFetch();
  _ready = true;
}

// ══════════════════════════════════════════════════════════════
// Provider registry + fetch interceptor
// ══════════════════════════════════════════════════════════════

function normalizeUrl(url) {
  // Resolve against the current page, then return just the pathname (/data/...)
  try {
    const base = (typeof window !== 'undefined' && window.location && window.location.href)
      ? window.location.href
      : 'http://localhost/';
    const u = new URL(url, base);
    return u.pathname;
  } catch {
    let p = url.split('?')[0].split('#')[0];
    if (!p.startsWith('/')) p = '/' + p;
    return p;
  }
}

function registerProvider(urlPath, asyncFn) {
  _providers.set(urlPath, asyncFn);
}

function patchFetch() {
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const normalized = normalizeUrl(url);

    if (normalized.startsWith('/data/') && normalized.endsWith('.json')) {
      const provider = _providers.get(normalized);
      if (provider) {
        try {
          const data = await provider();
          if (data !== undefined) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (err) {
          console.warn(`[DataLayer] Hydration failed for ${normalized}:`, err.message);
          // Fall through to original fetch (file)
        }
      }
    }
    return _originalFetch(input, init);
  };
}

// ══════════════════════════════════════════════════════════════
// Table hydration (generic for most content types)
// ══════════════════════════════════════════════════════════════

function hydrateTable(table, mapper, order = 'name_en', ascending = true) {
  return async () => {
    const { data, error } = await pgFrom(table)
      .select('*')
      .eq('status', 'published')
      .order(order, { ascending });
    if (error || !data) throw error || new Error('No data');
    return data.map(mapper).filter(Boolean);
  };
}

// ══════════════════════════════════════════════════════════════
// Mappers — DB rows → JSON-file shapes (preserving exact existing format)
// ══════════════════════════════════════════════════════════════

function mapDepartment(r) {
  return {
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    description: { en: r.description_en, ne: r.description_ne },
    website: r.website, phone: r.phone, email: r.email,
    services: r.services || [],
  };
}

function mapOffice(r) {
  return {
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    address: r.address, phone: r.phone, email: r.email,
    hours: r.hours, bestTime: r.best_time, province: r.province,
    mapUrl: r.map_url, services: r.services || [],
  };
}

function mapDaoOffice(r) {
  return {
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    district: r.district, headquarters: r.headquarters,
    province: r.province, website: r.website, phone: r.phone,
    hours: r.hours, bestTime: r.best_time,
    services: r.services || [], mapUrl: r.map_url,
  };
}

function mapForm(r) {
  return {
    id: r.id, serviceId: r.service_id,
    name: { en: r.name_en, ne: r.name_ne },
    format: r.format, url: r.url,
  };
}

function mapFee(r) {
  return {
    id: r.id, serviceId: r.service_id,
    type: { en: r.type_en, ne: r.type_ne },
    amount: r.amount, note: { en: r.note_en || '', ne: r.note_ne || '' },
  };
}

function mapProcessing(r) {
  return {
    id: r.id, serviceId: r.service_id,
    standardDays: r.standard_days, expressDays: r.express_days,
    maxDays: r.max_days,
    note: { en: r.note_en || '', ne: r.note_ne || '' },
  };
}

function mapFaq(r) {
  return {
    id: r.id, category: r.category,
    question: { en: r.question_en, ne: r.question_ne },
    answer: { en: r.answer_en, ne: r.answer_ne },
    keywords: r.keywords || [],
  };
}

function mapGlossary(r) {
  return {
    id: r.id, term: { en: r.term_en, ne: r.term_ne },
    definition: { en: r.definition_en, ne: r.definition_ne },
  };
}

function mapEmergency(r) {
  return {
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    number: r.number, icon: r.icon,
    description: { en: r.description_en || '', ne: r.description_ne || '' },
  };
}

function mapNews(r) {
  return {
    id: r.id, title: { en: r.title_en, ne: r.title_ne },
    summary: { en: r.summary_en, ne: r.summary_ne },
    body: { en: r.body_en || '', ne: r.body_ne || '' },
    date: r.date, category: r.category, source: r.source,
  };
}

function mapLifeEvent(r) {
  return {
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    description: { en: r.description_en, ne: r.description_ne },
    icon: r.icon, services: r.services || [],
    tips: r.tips || [], keywords: r.keywords || [],
  };
}

// ══════════════════════════════════════════════════════════════
// Services (complex — joins processing + fees inline)
// ══════════════════════════════════════════════════════════════

async function hydrateServices() {
  const { data: rows, error } = await pgFrom('services')
    .select('*')
    .eq('status', 'published')
    .order('name_en');
  if (error || !rows) throw error || new Error('No services');

  return rows.map(r => ({
    id: r.id,
    name: { en: r.name_en, ne: r.name_ne },
    description: { en: r.description_en, ne: r.description_ne },
    category: r.category,
    subCategory: r.sub_category,
    icon: r.icon,
    popular: r.popular,
    onlineAvailable: r.online_available,
    keywords: r.keywords || [],
    departmentId: r.department_id,
    offices: r.offices || [],
    steps: r.steps || [],
    documents: r.documents || [],
    commonMistakes: r.common_mistakes || [],
    tips: r.tips || [],
    relatedServices: r.related_services || [],
    officialSources: r.official_sources || [],
    feeDetails: r.fee_details || [],
    importantInfo: (r.important_info_en || r.important_info_ne)
      ? { en: r.important_info_en || '', ne: r.important_info_ne || '' }
      : undefined,
    disclaimer: (r.disclaimer_en || r.disclaimer_ne)
      ? { en: r.disclaimer_en || '', ne: r.disclaimer_ne || '' }
      : undefined,
    whereToApply: {
      type: r.application_type || 'dao_office',
      scope: r.application_scope || 'all_daos',
      daoOfficeId: r.dao_office_id || null,
      officeId: r.office_id || null,
      departmentId: r.application_department_id || null,
      province: r.application_province || null,
      district: r.application_district || null,
      custom: {
        name: r.custom_location_name || { en: '', ne: '' },
        address: r.custom_location_address || { en: '', ne: '' },
        phone: r.custom_location_phone || null,
        email: r.custom_location_email || null,
        website: r.custom_location_website || null,
        hours: r.custom_location_hours || { en: '', ne: '' },
      },
    },
    // Inline fees summary (used by citizenship.js)
    fees: (r.fees_summary_en || r.fees_summary_ne)
      ? { en: r.fees_summary_en || '', ne: r.fees_summary_ne || '' }
      : undefined,
    // Inline processing (used by citizenship.js)
    processing: (r.processing_standard_days || r.processing_max_days)
      ? {
          standardDays: r.processing_standard_days,
          expressDays: r.processing_express_days,
          maxDays: r.processing_max_days,
          note: { en: r.processing_note_en || '', ne: r.processing_note_ne || '' },
        }
      : undefined,
    lastUpdated: r.last_updated,
  }));
}

// ══════════════════════════════════════════════════════════════
// Translations
// ══════════════════════════════════════════════════════════════

async function hydrateTranslations(lang) {
  const { data, error } = await pgFrom('translations').select('key, ' + lang);
  if (error || !data) throw error || new Error('No translations');
  const result = {};
  data.forEach(row => {
    if (row[lang]) result[row.key] = row[lang];
  });
  return result;
}
