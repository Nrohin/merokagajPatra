
import { CONFIG, isSupabaseConfigured } from '../config.js';
import * as Auth from './auth.js';
import * as Store from './store.js';
import * as Layout from './layout.js';
import { render as renderLogin } from './login.js';
import { showToast } from './ui.js';

let _initialized = false;
let _adminModeActive = false;

// Editor modules (lazy loaded)
const EDITORS = {};
async function getEditor(name) {
  if (!EDITORS[name]) {
    EDITORS[name] = await import(`./editors/${name}.js`);
  }
  return EDITORS[name];
}

export async function handle(restPath, container) {
  // If Supabase isn't configured, show a clear setup message instead of a raw error
  if (!isSupabaseConfigured()) {
    container.innerHTML = `
      <div class="admin-login">
        <div class="admin-login-card">
          <div class="admin-login-logo">
            <img src="assets/icons/logo.png" alt="MeroKagaj" style="height:48px;border-radius:var(--radius-md)">
            <h1>MeroKagajpatra</h1>
            <p>Admin setup required</p>
          </div>
          <div class="admin-alert admin-alert--error" style="display:block">
            Supabase is not configured. Open <code>js/config.local.js</code> in the project and add your
            <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code>, then redeploy the site.
          </div>
          <p class="admin-login-footer">Keys are found in Supabase Dashboard &rarr; Settings &rarr; API.</p>
        </div>
      </div>`;
    return () => {};
  }

  // Initialize auth listener on first call (waits for initial auth resolution)
  if (!_initialized) {
    _initialized = true;
    await Auth.init();
  }

  // Check session (refresh if needed)
  const profile = Store.getProfile();

  if (!profile) {
    // Show login
    renderLogin(container);
    // Watch for auth changes
    const unsub = Store.onChange(() => {
      if (Store.getProfile()) {
        unsub();
        handle(restPath, container);
      }
    });
    return () => unsub;
  }

  if (!profile.is_active) {
    container.innerHTML = `<div class="admin-login"><div class="admin-login-card">
      <h2>Account Deactivated</h2>
      <p>Your account has been deactivated. Please contact an administrator.</p>
    </div></div>`;
    return () => {};
  }

  // Render admin shell
  Layout.renderShell(container, restPath);
  // Content goes into admin-content
  const contentEl = Layout.getContentEl();
  if (!contentEl) return () => {};

  _adminModeActive = true;

  // Route to sub-page
  await routeTo(restPath, contentEl);

  return () => {
    _adminModeActive = false;
  };
}

async function routeTo(restPath, contentEl) {
  // Parse: 'services/123/edit' → section='services', id='123', action='edit'
  const parts = (restPath || '').split('/').filter(Boolean);
  const section = parts[0] || '';
  const id = parts[1] || '';
  const action = parts[2] || '';

  try {
    switch (section) {
      case '': case 'dashboard':
        const dashModule = await import('./dashboard.js');
        await dashModule.render(contentEl);
        break;
      case 'services':
        const svcs = await getEditor('services');
        if (id) await svcs.renderEdit(contentEl, id);
        else await svcs.renderList(contentEl);
        break;
      case 'departments':
        const dept = await getEditor('departments');
        if (id) await dept.renderEdit(contentEl, id);
        else await dept.renderList(contentEl);
        break;
      case 'offices':
        const off = await getEditor('offices');
        if (id) await off.renderEdit(contentEl, id);
        else await off.renderList(contentEl);
        break;
      case 'dao-offices':
        const dao = await getEditor('daos');
        if (id) await dao.renderEdit(contentEl, id);
        else await dao.renderList(contentEl);
        break;
      case 'forms':
        const frm = await getEditor('forms');
        if (id) await frm.renderEdit(contentEl, id);
        else await frm.renderList(contentEl);
        break;
      case 'fees':
        const fee = await getEditor('fees');
        if (id) await fee.renderEdit(contentEl, id);
        else await fee.renderList(contentEl);
        break;
      case 'processing':
        const proc = await getEditor('processing');
        if (id) await proc.renderEdit(contentEl, id);
        else await proc.renderList(contentEl);
        break;
      case 'faqs':
        const faq = await getEditor('faqs');
        if (id) await faq.renderEdit(contentEl, id);
        else await faq.renderList(contentEl);
        break;
      case 'glossary':
        const gl = await getEditor('glossary');
        if (id) await gl.renderEdit(contentEl, id);
        else await gl.renderList(contentEl);
        break;
      case 'emergency':
        const em = await getEditor('emergency');
        if (id) await em.renderEdit(contentEl, id);
        else await em.renderList(contentEl);
        break;
      case 'news':
        const nw = await getEditor('news');
        if (id) await nw.renderEdit(contentEl, id);
        else await nw.renderList(contentEl);
        break;
      case 'life-events':
        const le = await getEditor('lifeEvents');
        if (id) await le.renderEdit(contentEl, id);
        else await le.renderList(contentEl);
        break;
      case 'translations':
        const tr = await getEditor('translations');
        await tr.render(contentEl);
        break;
      case 'administrators':
        if (!Store.can('manage-admins')) {
          contentEl.innerHTML = '<div class="admin-alert admin-alert--error">You don\'t have permission to view this page.</div>';
          return;
        }
        const adm = await getEditor('administrators');
        if (id) await adm.renderEdit(contentEl, id);
        else await adm.renderList(contentEl);
        break;
      case 'audit-log':
        if (!Store.can('view-audit')) {
          contentEl.innerHTML = '<div class="admin-alert admin-alert--error">You don\'t have permission to view this page.</div>';
          return;
        }
        const audit = await getEditor('audit');
        await audit.render(contentEl);
        break;
      case 'settings':
        if (!Store.can('settings')) {
          contentEl.innerHTML = '<div class="admin-alert admin-alert--error">You don\'t have permission to view this page.</div>';
          return;
        }
        const sett = await getEditor('settings');
        await sett.render(contentEl);
        break;
      default:
        contentEl.innerHTML = '<div class="admin-empty"><p>Page not found.</p></div>';
    }
  } catch (err) {
    console.error('Admin route error:', err);
    contentEl.innerHTML = `<div class="admin-alert admin-alert--error">An error occurred: ${esc(err.message)}</div>`;
  }
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
