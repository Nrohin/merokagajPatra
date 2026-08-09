
let _session = null;
let _profile = null;
const _subs = new Set();

export function setSession(s) { _session = s; _notify(); }
export function setProfile(p) { _profile = p; _notify(); }
export function getSession() { return _session; }
export function getProfile() { return _profile; }

export function onChange(fn) { _subs.add(fn); return () => _subs.delete(fn); }
function _notify() { _subs.forEach(fn => { try { fn(); } catch {} }); }

export const PERMS = {
  super_admin: ['manage-admins', 'view-audit', 'settings', 'delete', 'publish', 'crud'],
  admin: ['view-audit', 'delete', 'publish', 'crud'],
  editor: ['draft', 'crud'],
};

export function can(perm) {
  if (!_profile) return false;
  return PERMS[_profile.role]?.includes(perm) || false;
}
