/**
 * Shared category definitions with translation keys.
 * Single source of truth — used by home, services, category pages.
 */

import { t } from '../i18n.js';

export const CATEGORY_ICONS = {
  civil:       'badge',
  travel:      'flight',
  education:   'school',
  business:    'business',
  property:    'home',
  health:      'medical_services',
  vehicle:     'directions_car',
  employment:  'work',
  family:      'family_restroom',
  other:       'more_horiz',
};

/* Fixed display order — civil always first */
const CATEGORY_ORDER = ['civil', 'family', 'travel', 'education', 'business', 'property', 'health', 'vehicle', 'employment', 'other'];

/**
 * Get translated category label.
 */
export function categoryLabel(slug) {
  return t(`cat.${slug}`);
}

/**
 * Extract categories from a services array, with counts.
 * Returns [{ slug, name, icon, count }]
 */
export function extractCategories(services) {
  const catMap = {};
  (services || []).forEach(s => {
    const cat = s.category || 'other';
    if (!catMap[cat]) {
      catMap[cat] = {
        slug: cat,
        name: categoryLabel(cat),
        icon: CATEGORY_ICONS[cat] || 'more_horiz',
        count: 0,
      };
    }
    catMap[cat].count++;
  });
  return Object.values(catMap).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.slug);
    const bi = CATEGORY_ORDER.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
