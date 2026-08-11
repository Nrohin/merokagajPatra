
import { signInWithPassword as sbSignIn, signOut as sbSignOut, getSession, onAuthStateChange, resetPasswordForEmail } from '../supabase.js';
import { from } from '../supabase.js';
import * as Store from './store.js';

// Only these roles may use the admin panel. A profile with an unknown role
// is treated as unauthorized (defense-in-depth on top of RLS).
const ALLOWED_ROLES = ['super_admin', 'admin', 'editor'];

export function init() {
  return new Promise((resolve) => {
    onAuthStateChange(async (event, session) => {
      try {
        if (session && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
          const { data, error } = await from('profiles').select('*').eq('id', session.user.id).single();
          if (data && data.is_active && ALLOWED_ROLES.includes(data.role)) {
            Store.setSession(session);
            Store.setProfile(data);
          }
        }
      } catch { /* no profile yet — treat as signed out */ }
      if (event === 'SIGNED_OUT') {
        Store.setSession(null);
        Store.setProfile(null);
      }
      resolve();
    });
  });
}

export async function signIn(email, password) {
  const session = await sbSignIn(email, password);
  const { data, error } = await from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !data) throw new Error('Could not load your profile. Contact an administrator.');
  if (!data.is_active) throw new Error('Your account has been deactivated. Contact an administrator.');
  if (!ALLOWED_ROLES.includes(data.role)) throw new Error('This account is not authorized for the admin panel.');
  Store.setSession(session);
  Store.setProfile(data);
  return data;
}

export async function signOut() {
  await sbSignOut();
  Store.setSession(null);
  Store.setProfile(null);
}

export async function resetPassword(email) {
  await resetPasswordForEmail(email);
}

export async function createAdmin(email, password, fullName, role) {
  const session = Store.getSession();
  if (!session) throw new Error('Not authenticated');
  // Use signUp to create user (creates auth user + triggers profile creation)
  const res = await fetch(
    (await import('../config.js')).CONFIG.SUPABASE_URL + '/auth/v1/signup',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': (await import('../config.js')).CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({
        email, password, data: { full_name: fullName },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || 'Could not create user');
  }
  // The trigger creates the profile. Now update role.
  const { user } = await res.json();
  if (user) {
    await from('profiles').update({ full_name: fullName, role }).eq('id', user.id);
  }
  return true;
}

export async function updateProfileRole(userId, role) {
  const { error } = await from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function toggleProfileActive(userId, isActive) {
  const { error } = await from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) throw error;
}

export function getProfile() { return Store.getProfile(); }
