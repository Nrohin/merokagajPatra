/**
 * Fuzzy Search Engine with Roman Nepali support.
 * Users can type Nepali words in Roman letters (e.g., "nagarikta" → नागरिकता).
 */

const index = [];

/* ============================================================
   Roman Nepali → keyword mapping
   Covers all common government terms users might type.
   ============================================================ */

const ROMAN_NEPALI = {
  // Civil documents
  'nagrikta':     'nagarikta nagarikta citizenship nagarik',
  'nagarikta':    'nagarikta nagarikta citizenship nagarik',
  'nagarnikta':   'nagarikta citizenship',
  'nagrikta':     'nagarikta citizenship',
  'nagarrickta':  'nagarikta citizenship',
  'citizenship':  'citizenship nagarikta',

  // Passport
  'passport':     'passport pasport',
  'pasport':      'passport pasport',
  'paasport':     'passport pasport',
  'paasaport':    'passport pasport',

  // Driving license
  'chalak':       'chalak parmit driving license',
  'chalaak':      'chalak parmit driving license',
  'chalak parmit':'chalak parmit driving license',
  'parmit':       'parmit permit license',
  'permit':       'parmit permit license',
  'license':      'license parmit driving',
  'laisense':     'license parmit',
  'laicense':     'license parmit',
  'driving':      'driving chalak license',
  'gadi':         'gadi vehicle car driving',
  'gaadi':        'gadi vehicle car driving',
  'sawari':       'sawari vehicle transport',
  'sabaari':      'sawari vehicle transport',

  // Birth registration
  'janma':        'janma birth',
  'janam':        'janma birth',
  'jnm':          'janma birth',
  'jannma':       'janma birth',
  'darta':        'darta registration',
  'dartaa':       'darta registration',
  'darata':       'darta registration',
  'birth':        'birth janma registration',
  'bacha':        'bacha baby child newborn',
  'bachaa':       'bacha baby child newborn',
  'baal':         'baal child kid baby',
  'baal baal':    'baal child',
  'sishu':        'sishu baby child infant',

  // Marriage
  'biwaha':       'biwaha marriage wedding',
  'biwaaaha':     'biwaha marriage wedding',
  'biwahaa':      'biwaha marriage wedding',
  'bibaha':       'biwaha marriage wedding',
  'byabaha':      'biwaha marriage wedding',
  'byabahaa':     'biwaha marriage wedding',
  'luga':         'biwaha marriage',
  'marriage':     'marriage biwaha wedding',
  'wedding':      'wedding biwaha marriage',
  'wivaah':       'biwaha marriage',
  'wivaha':       'biwaha marriage',

  // Land
  'jagga':        'jagga land property',
  'jagaa':        'jagga land property',
  'jaggaa':       'jagga land property',
  'zamin':        'zamin jagga land',
  'zameen':       'zamin jagga land',
  'lalpurja':     'lalpurja land ownership title',
  'lalpurjaa':    'lalpurja land ownership title',
  'lalpurjaaa':   'lalpurja land ownership title',
  'naxa':         'naxa naxaa map land',
  'naxaa':        'naxa naxaa map land',
  'land':         'land jagga property',
  'property':     'property jagga land',
  'kothaa':       'kothaa house property',
  'kotha':        'kotha house property',
  'ghar':         'ghar house home property',
  'ghar jagga':   'ghar jagga house property',

  // Business
  'byabsaaya':    'byabsaaya business trade',
  'byabasaya':    'byabsaaya business trade',
  'byabasaaya':   'byabsaaya business trade',
  'byabaasaya':   'byabsaaya business trade',
  'dhanda':       'dhanda business trade',
  'dhandaa':      'dhanda business trade',
  'company':      'company kampani business',
  'kampani':      'kampani company business',
  'kampanii':     'kampani company business',
  'business':     'business byabsaaya company',

  // PAN
  'pan':          'pan tax number',
  'paan':         'pan tax number',
  'karkhuna':     'karkhuna tax',
  'karkhana':     'karkhuna tax',
  'kara':         'kara tax',
  'kaara':        'kara tax',
  'tax':          'tax kara pan',

  // National ID
  'pehichaan':    'pehichaan identity id',
  'pehichan':     'pehichaan identity id',
  'pehichaanpatra':'pehichaan identity id card',
  'nid':          'nid national identity',
  'card':         'card id identity',
  'kard':         'card id',

  // Social security
  'samajik suraksha': 'social security ssf',
  'ssf':          'ssf social security',
  'shramik':      'shramik worker labor',
  'sramik':       'shramik worker labor',
  'jyagiree':     'jyagiree employment job',
  'jyagire':      'jyagiree employment job',
  'rojgaari':     'rojgaari employment job',
  'rojgar':       'rojgaari employment job',
  'rojgaar':      'rojgaari employment job',

  // Office
  'karyalaya':    'karyalaya office',
  'karyaalaya':   'karyalaya office',
  'daaoffice':    'dao district administration',
  'dao':          'dao district administration office',
  'ward':         'ward local office',
  'ward office':  'ward office local',
  'addaalat':     'addaalat court',
  'adalat':       'addaalat court',
  'court':        'court adalat',
  'adhhikaran':   'adhhikaran authority',
  'adhikaran':    'adhhikaran authority',

  // Documents
  'kaagjat':      'kaagjat document papers',
  'kaagjaat':     'kaagjat document papers',
  'kaagajat':     'kaagjat document papers',
  'kagjat':       'kaagjat document papers',
  'kagjat':       'kaagjat document papers',
  'lilpatra':     'lilpatra document paper',
  'lilpatraa':    'lilpatra document paper',
  'document':     'document kaagjat paper',

  // Fee
  'shulk':        'shulk fee charge',
  'shulka':       'shulk fee charge',
  'dam':          'dam price cost fee',
  'kimmat':       'kimmat price cost',
  'kimata':       'kimmat price cost',
  'tirne':        'tirne pay',
  'tirna':        'tirne pay',

  // Process / time
  'samaya':       'samaya time duration',
  'lamo':         'lamo long',
  'chito':        'chito fast quick express',
  'chitai':       'chito fast quick express',
  'dindinii':     'dindinii days',
  'din':          'din day days',
  'dinma':        'dinma in days',

  // General
  'sarkaar':      'sarkaar government',
  'sarkar':       'sarkaar government',
  'sarkari':      'sarkari government official',
  'saarkari':     'sarkari government official',
  'form':         'form application',
  'farm':         'form application farm',
  'aavedan':      'aavedan application',
  'aavedana':     'aavedan application',
  'aavedanpatra': 'aavedan application form',
  'form bharnu':  'form fill application',
  'form bhareko': 'form filled application',
  'naya':         'naya new',
  'punarnava':    'punarnava renewal',
  'punarikaran':  'punarnava renewal',
  'navikaran':    'punarnava renewal renewal',
  'renewal':      'renewal punarnava',
  'valid':        'valid mahinso',
  'validity':     'validity mahinso',
  'milni':        'milni match get',
  'paaunu':       'paaunu get receive',
  'laagcha':      'laagcha takes required',
  'lagchaa':      'laagcha takes required',
  'laagnxa':      'laagcha takes required',
  'laagdachha':   'laagcha takes required',
  'laagdincha':   'laagcha takes required',
  'kati':         'kati how much',
  'kattii':       'kati how much',
  'kasari':       'kasari how to',
  'kaha':         'kaha where',
  'kaha bata':    'kaha bata where from',
  'kahaa':        'kaha where',
  'kahile':       'kahile when',
  'kun':          'kun which',
  'kunai':        'kunai any',
  'kehi':         'kehi some anything',
  'sabai':        'sabai all everything',
  'help':         'help sahayog sahita',
  'sahaayog':     'help sahayog support',
  'sahayog':      'help sahayog support',
};

/**
 * Expand a search term with all Roman Nepali variants.
 */
function expandRomanNepali(term) {
  const t = term.toLowerCase().replace(/[^a-z\s]/g, '');
  const lookup = ROMAN_NEPALI[t];
  return lookup ? lookup.split(' ') : [term];
}

/**
 * Build a searchable Roman Nepali string for an index entry.
 */
function buildRomanField(item) {
  const parts = [];
  // Match keywords against ROMAN_NEPALI values to find Roman forms
  for (const [roman, variants] of Object.entries(ROMAN_NEPALI)) {
    const varList = variants.split(' ');
    for (const kw of (item.keywords || [])) {
      if (varList.includes(kw.toLowerCase())) {
        parts.push(roman);
      }
    }
  }
  // Also add the item ID as Roman searchable (e.g., "citizenship-certificate")
  if (item.id) parts.push(item.id.replace(/-/g, ' '));
  return parts.join(' ');
}

/**
 * Load and index all searchable data.
 */
export async function init() {
  const [services, departments, faq, glossary, lifeEvents] = await Promise.all([
    loadJSON('data/services.json'),
    loadJSON('data/departments.json'),
    loadJSON('data/faq.json'),
    loadJSON('data/glossary.json'),
    loadJSON('data/life-events.json'),
  ]);

  // Index services
  (services || []).forEach(s => {
    index.push({
      id: s.id,
      type: 'service',
      title: s.name?.en || s.name?.ne || s.id,
      titleNe: s.name?.ne || '',
      description: s.description?.en || '',
      category: s.category || '',
      keywords: s.keywords || [],
      icon: s.icon || 'description',
      route: `#/service/${s.id}`,
    });
  });

  // Index departments
  (departments || []).forEach(d => {
    index.push({
      id: d.id,
      type: 'department',
      title: d.name?.en || d.id,
      titleNe: d.name?.ne || '',
      description: d.description?.en || '',
      category: 'department',
      keywords: d.keywords || [],
      icon: 'account_balance',
      route: `#/department/${d.id}`,
    });
  });

  // Index FAQs
  (faq || []).forEach(f => {
    index.push({
      id: `faq-${f.id}`,
      type: 'faq',
      title: f.question?.en || f.question?.ne || '',
      titleNe: f.question?.ne || '',
      description: f.answer?.en || '',
      category: f.category || 'general',
      keywords: f.keywords || [],
      icon: 'help',
      route: `#/faq#${f.id}`,
    });
  });

  // Index glossary terms
  (glossary || []).forEach(g => {
    index.push({
      id: `glossary-${g.id}`,
      type: 'glossary',
      title: g.term?.en || g.term?.ne || '',
      titleNe: g.term?.ne || '',
      description: g.definition?.en || '',
      category: 'glossary',
      keywords: [],
      icon: 'menu_book',
      route: `#/glossary#${g.id}`,
    });
  });

  // Index life events
  (lifeEvents || []).forEach(e => {
    index.push({
      id: e.id,
      type: 'life-event',
      title: e.name?.en || e.id,
      titleNe: e.name?.ne || '',
      description: e.description?.en || '',
      category: 'life-event',
      keywords: e.keywords || [],
      icon: e.icon || 'star',
      route: `#/life-event/${e.id}`,
    });
  });

  // Pre-compute Roman Nepali field for each entry
  index.forEach(item => {
    item.romanSearch = buildRomanField(item);
  });
}

/**
 * Search the index with fuzzy matching + Roman Nepali.
 * @param {string} query
 * @param {object} options - { limit, type }
 * @returns {Array} Ranked results
 */
export function search(query, options = {}) {
  const { limit = 10, type } = options;
  if (!query || query.trim().length < 2) return [];

  const rawTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  // Expand each term with Roman Nepali variants
  const termGroups = rawTerms.map(t => expandRomanNepali(t));

  const results = [];

  for (const item of index) {
    if (type && item.type !== type) continue;

    let score = 0;
    const titleLower = item.title.toLowerCase();
    const titleNeLower = item.titleNe.toLowerCase();
    const descLower = item.description.toLowerCase();
    const keywordsLower = (item.keywords || []).join(' ').toLowerCase();
    const romanLower = (item.romanSearch || '').toLowerCase();

    for (const rawTerm of rawTerms) {
      // Standard English matches
      if (titleLower.includes(rawTerm)) score += 100;
      if (titleNeLower.includes(rawTerm)) score += 90;
      if (titleLower.startsWith(rawTerm)) score += 50;
      if (keywordsLower.includes(rawTerm)) score += 40;
      if (descLower.includes(rawTerm)) score += 20;
      if (fuzzyMatch(rawTerm, titleLower)) score += 30;
      if (fuzzyMatch(rawTerm, descLower)) score += 10;
    }

    // Roman Nepali expanded matches (each raw term may expand to multiple variants)
    for (const expanded of termGroups) {
      for (const variant of expanded) {
        if (variant.length < 2) continue;
        if (titleLower.includes(variant)) score += 95;
        if (keywordsLower.includes(variant)) score += 50;
        if (romanLower.includes(variant)) score += 60;
        if (descLower.includes(variant)) score += 25;
      }
    }

    if (score > 0) {
      results.push({ ...item, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Simple fuzzy matching — all chars of needle appear in order in haystack.
 */
function fuzzyMatch(needle, haystack) {
  let ni = 0;
  for (let hi = 0; hi < haystack.length && ni < needle.length; hi++) {
    if (haystack[hi] === needle[ni]) ni++;
  }
  return ni === needle.length;
}

/**
 * Highlight matching text in a string.
 */
export function highlight(text, query) {
  if (!text || !query) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;

  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  }

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Load JSON file.
 */
async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
