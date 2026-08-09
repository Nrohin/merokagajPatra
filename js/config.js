/**
 * MeroKagaj — Configuration
 * Deploy-time configuration for Supabase CMS integration.
 * For local overrides: use config.local.js (gitignored).
 */

const localOverrides = {};

// config.local.js is loaded synchronously via <script> in index.html BEFORE this module.
// Values placed on window.MEROKAGAJ_CONFIG will override defaults.
if (typeof window !== 'undefined' && window.MEROKAGAJ_CONFIG) {
  Object.assign(localOverrides, window.MEROKAGAJ_CONFIG);
}

export const CONFIG = Object.assign({
  ADMIN_PATH: 'manage-portal-x7k9',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SITE_NAME_EN: 'MeroKagajPatra',
  SITE_NAME_NE: 'मेरोकागजपत्र',
}, localOverrides);

export function isSupabaseConfigured() {
  return !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}
