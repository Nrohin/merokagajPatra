
import { from } from '../supabase.js';
import * as Store from './store.js';

export { from };

export async function list(table, { search, searchFields, status, order = 'updated_at.desc', limit = 50, offset = 0 } = {}) {
  let q = from(table).select('*');
  if (search && searchFields?.length) {
    // Sanitize the term so special characters can't break the or=(...) syntax
    // or act as unintended wildcards. Parens/commas would be parsed as
    // structure by PostgREST; % and _ are ILIKE wildcards.
    const term = String(search).replace(/[(),%_]/g, ' ').trim();
    if (term) {
      if (searchFields.length === 1) {
        q = q.ilike(searchFields[0], `%${term}%`);
      } else {
        // PostgREST OR across ALL search fields — otherwise a record matching
        // only the 2nd+ field (e.g. Nepali name) never reaches the client.
        // PostgREST requires parens around multi-condition OR: or=(a,b).
        q = q.or(`(${searchFields.map(f => `${f}.ilike.%${term}%`).join(',')})`);
      }
    }
  }
  if (status) q = q.eq('status', status);
  if (order) {
    const [col, dir] = order.split('.');
    q = q.order(col, { ascending: dir === 'asc' });
  }
  q = q.range(offset, offset + limit - 1);
  // Always request an exact count so pagination and the "N items" badge are
  // correct. PostgREST returns the total matching rows (before limit/offset)
  // in the Content-Range header when Prefer: count=exact is set.
  const { data, error, count: total } = await q.count('exact');
  if (error) throw error;

  // No client-side re-filter needed: the server OR already matches any field.
  return { data: data || [], total };
}

export async function get(table, id) {
  const { data, error } = await from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function insert(table, row) {
  const { data, error } = await from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function update(table, id, row) {
  const { data, error } = await from(table).update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function remove(table, id) {
  const { error } = await from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function logAction(action, entityType, entityId, details) {
  const profile = Store.getProfile();
  if (!profile) return;
  try {
    await from('audit_logs').insert({
      admin_id: profile.id,
      admin_email: profile.email,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      details,
    });
  } catch { /* don't fail on audit errors */ }
}

export async function getStats() {
  const counts = {};
  const tables = [
    ['services', 'services'], ['departments', 'departments'],
    ['offices', 'offices'], ['dao_offices', 'dao_offices'],
    ['forms', 'forms'], ['fees', 'fees'],
    ['processing_times', 'processing'], ['faqs', 'faqs'],
    ['glossary', 'glossary'], ['emergency_numbers', 'emergency'],
    ['news', 'news'], ['life_events', 'life_events'],
  ];
  for (const [table, key] of tables) {
    const { count } = await from(table).select('id').count('exact');
    counts[key] = count || 0;
  }
  // Draft count
  const { count: draftCount } = await from('services').select('id').count('exact').eq('status', 'draft');
  counts.drafts = draftCount || 0;
  return counts;
}

export async function getRecentUpdates(limit = 5) {
  const { data } = await from('services')
    .select('id, name_en, name_ne, updated_at, updated_by')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (!data?.length) return [];
  // Fetch profile names
  const profileIds = [...new Set(data.map(r => r.updated_by).filter(Boolean))];
  const profiles = {};
  if (profileIds.length) {
    const { data: profs } = await from('profiles').select('id, full_name, email').in('id', profileIds);
    (profs || []).forEach(p => { profiles[p.id] = p.full_name || p.email; });
  }
  return data.map(r => ({
    id: r.id, name: { en: r.name_en, ne: r.name_ne },
    updatedAt: r.updated_at, updatedBy: profiles[r.updated_by] || 'System',
  }));
}
