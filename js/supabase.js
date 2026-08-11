
/**
 * Minimal Supabase Client — Auth + PostgREST
 * Zero dependencies. Implements only what MeroKagaj needs:
 *   Auth: signInWithPassword, signOut, getSession, onAuthStateChange, resetPassword
 *   DB:   select, insert, update, upsert, delete (via PostgREST REST API)
 *
 * Does NOT provide: realtime, RPC, storage, subscriptions.
 */

const SESSION_KEY = 'merokagaj_admin_session';
const API = '/auth/v1';

let _url = '';
let _anonKey = '';
let _listeners = [];

// ── Token / Session helpers ────────────────────────────────

function _storeSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}
function _clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
function _getStoredSession() {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

function _isExpired(session) {
  if (!session || !session.expires_at) return true;
  return (session.expires_at * 1000) < Date.now() + 60_000; // 1 min buffer
}

// ── Auth ───────────────────────────────────────────────────

async function _authRequest(path, body) {
  if (!_url) {
    throw new Error('Supabase is not configured. Add your SUPABASE_URL and SUPABASE_ANON_KEY to js/config.local.js.');
  }
  let res;
  try {
    res = await fetch(_url + API + path, {
      method: 'POST',
      headers: { 'Content': 'application/json', 'apikey': _anonKey },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Cannot reach Supabase at ' + _url + '. Check your connection, and make sure this site domain is allowed in Supabase Authentication settings (CORS).');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || `Auth error ${res.status}`);
  }
  return res.json();
}

export async function signInWithPassword(email, password) {
  const data = await _authRequest('/token?grant_type=password', { email, password });
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: data.expires_at,
    user: data.user,
  };
  _storeSession(session);
  _notifyListeners('SIGNED_IN', session);
  return session;
}

export async function signOut() {
  const session = _getStoredSession();
  if (session?.access_token) {
    try {
      await fetch(_url + API + '/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': _anonKey },
      });
    } catch {}
  }
  _clearSession();
  _notifyListeners('SIGNED_OUT', null);
}

export async function resetPasswordForEmail(email) {
  await _authRequest('/recover', { email });
}

export async function getSession() {
  let session = _getStoredSession();
  if (!session) return null;
  if (_isExpired(session)) {
    try {
      session = await refreshSession(session.refresh_token);
    } catch {
      _clearSession();
      _notifyListeners('SIGNED_OUT', null);
      return null;
    }
  }
  return session;
}

async function refreshSession(refresh_token) {
  const data = await _authRequest('/token?grant_type=refresh_token', { refresh_token });
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: data.expires_at,
    user: data.user,
  };
  _storeSession(session);
  return session;
}

export function onAuthStateChange(callback) {
  _listeners.push(callback);
  // Fire immediately with current state
  const session = _getStoredSession();
  if (!session) {
    callback('SIGNED_OUT', null);
  } else if (!_isExpired(session)) {
    callback('INITIAL_SESSION', session);
  } else {
    // Attempt refresh
    refreshSession(session.refresh_token)
      .then(s => callback('TOKEN_REFRESHED', s))
      .catch(() => { _clearSession(); callback('SIGNED_OUT', null); });
  }
  return () => { _listeners = _listeners.filter(l => l !== callback); };
}

function _notifyListeners(event, session) {
  _listeners.forEach(l => { try { l(event, session); } catch {} });
}

// ── PostgREST Query Builder ────────────────────────────────

function _authHeader() {
  const session = _getStoredSession();
  return session?.access_token || '';
}

function _headers() {
  return {
    'apikey': _anonKey,
    'Authorization': `Bearer ${_authHeader()}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

class PostgrestQuery {
  constructor(table) {
    this._table = table;
    this._filters = [];
    this._select = '*';
    this._order = null;
    this._limit = null;
    this._offset = null;
    this._single = false;
    this._count = false;
    this._method = 'GET';
    this._body = null;
  }

  select(cols) { this._select = cols || '*'; return this; }
  eq(col, val) { this._filters.push(`${col}=eq.${_enc(val)}`); return this; }
  neq(col, val) { this._filters.push(`${col}=neq.${_enc(val)}`); return this; }
  gt(col, val) { this._filters.push(`${col}=gt.${_enc(val)}`); return this; }
  gte(col, val) { this._filters.push(`${col}=gte.${_enc(val)}`); return this; }
  lt(col, val) { this._filters.push(`${col}=lt.${_enc(val)}`); return this; }
  lte(col, val) { this._filters.push(`${col}=lte.${_enc(val)}`); return this; }
  like(col, val) { this._filters.push(`${col}=like.${_enc(val)}`); return this; }
  ilike(col, val) { this._filters.push(`${col}=ilike.${_enc(val)}`); return this; }
  in(col, vals) { this._filters.push(`${col}=in.(${vals.map(v => _enc(v)).join(',')})`); return this; }
  is(col, val) { this._filters.push(`${col}=is.${val}`); return this; }
  order(col, opts = {}) { this._order = `${col}.${opts.ascending === false ? 'desc' : 'asc'}`; return this; }
  limit(n) { this._limit = n; return this; }
  range(from, to) { this._offset = from; this._limit = to - from + 1; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; this._maybe = true; return this; }
  count(exact) { this._count = true; return this; }

  insert(rows) { this._method = 'POST'; this._body = Array.isArray(rows) ? rows : [rows]; return this; }
  update(data) { this._method = 'PATCH'; this._body = data; return this; }
  upsert(data, opts = {}) { this._method = 'POST'; this._body = data; this._onConflict = opts.onConflict; return this; }
  delete() { this._method = 'DELETE'; return this; }

  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err, count: 0 });
    }
  }

  async _execute() {
    let url = `${_url}/rest/v1/${this._table}`;
    const params = new URLSearchParams();

    if (this._method === 'GET') {
      if (this._select) params.set('select', this._select);
      if (this._order) params.set('order', this._order);
      if (this._limit != null) params.set('limit', this._limit);
      if (this._offset != null) params.set('offset', this._offset);
    }
    // Filters (the WHERE clause) apply to GET, PATCH (update) and DELETE —
    // but NOT to POST (insert/upsert), which carries the payload in the body.
    // Without this, PATCH/DELETE go out with no WHERE clause and PostgREST
    // rejects them ("UPDATE requires a WHERE clause") or, worse, mass-updates.
    if (this._method !== 'POST') {
      this._filters.forEach(f => {
        const idx = f.indexOf('=');
        const col = f.slice(0, idx);
        const val = f.slice(idx + 1);
        params.append(col, val);
      });
    }
    if (this._onConflict) params.set('on_conflict', this._onConflict);

    const qs = params.toString();
    if (qs) url += '?' + qs;

    const headers = _headers();
    if (this._single) headers['Accept'] = 'application/vnd.pgrst.object+json';
    if (this._count) headers['Prefer'] = 'count=exact,return=representation';
    if (this._method !== 'GET' && this._method !== 'DELETE') {
      headers['Prefer'] += ',resolution=merge-duplicates';
    }

    const opts = { method: this._method, headers };
    if (this._body) opts.body = JSON.stringify(this._body);

    if (!_url) {
      throw new Error('Supabase is not configured. Add your SUPABASE_URL and SUPABASE_ANON_KEY to js/config.local.js.');
    }

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      throw new Error('Cannot reach Supabase at ' + _url + '. Check your connection and CORS settings.');
    }

    // Access token expired mid-session: refresh once and retry.
    // Only for state-changing or authed requests — a public anon read
    // that returns 401 is a genuine error (e.g. wrong project keys).
    if (res.status === 401 && _authHeader()) {
      try {
        const stored = _getStoredSession();
        if (stored?.refresh_token) {
          const refreshed = await refreshSession(stored.refresh_token);
          _notifyListeners('TOKEN_REFRESHED', refreshed);
          // Retry once with the new token
          const retryHeaders = _headers();
          if (this._single) retryHeaders['Accept'] = 'application/vnd.pgrst.object+json';
          if (this._count) retryHeaders['Prefer'] = 'count=exact,return=representation';
          if (this._method !== 'GET' && this._method !== 'DELETE') {
            retryHeaders['Prefer'] += ',resolution=merge-duplicates';
          }
          const retryOpts = { method: this._method, headers: retryHeaders };
          if (this._body) retryOpts.body = opts.body;
          res = await fetch(url, retryOpts);
        }
      } catch { /* refresh failed — surface original error */ }
    }

    const countHeader = res.headers.get('content-range');
    const total = countHeader ? parseInt(countHeader.split('/')[1]) : 0;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
    }
    if (res.status === 204) return { data: null, error: null, count: 0 };

    let data = await res.json();
    if (this._single && this._maybe) data = data ?? null;
    if (this._single && Array.isArray(data)) data = data[0] || null;

    return { data, error: null, count: total };
  }
}

function _enc(v) {
  if (v == null) return '';
  if (typeof v === 'string') return encodeURIComponent(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

// ── Public API ─────────────────────────────────────────────

export function from(table) {
  return new PostgrestQuery(table);
}

export function initClient(url, anonKey) {
  _url = url.replace(/\/+$/, '');
  _anonKey = anonKey;
}

export { _getStoredSession as getStoredSession };
