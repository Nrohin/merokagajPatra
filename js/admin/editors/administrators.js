
import * as db from '../db.js';
import { esc, showToast, confirmDialog, showModal, setDirty, field, selectField, getFormData } from '../ui.js';
import * as Auth from '../auth.js';
import * as Store from '../store.js';
import { from } from '../../supabase.js';

const ROLES = [['editor','Editor'],['admin','Admin'],['super_admin','Super Admin']];

export async function renderList(c) {
  c.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';
  const { data } = await from('profiles').select('*').order('created_at', { ascending: false });
  if (!data?.length) { c.innerHTML = '<div class="admin-empty"><p>No administrators found.</p></div>'; return; }

  c.innerHTML = `
    <div class="admin-page-header">
      <div><h1>Administrators</h1><p>Manage admin accounts and roles.</p></div>
      <button class="admin-btn admin-btn--primary" id="adm-add">+ Add Administrator</button>
    </div>
    <div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${data.map(u => `<tr>
        <td>${esc(u.full_name || '(no name)')}</td>
        <td>${esc(u.email)}</td>
        <td><span class="tag tag--primary">${esc(u.role)}</span></td>
        <td><span class="tag tag--${u.is_active?'success':'error'}">${u.is_active?'Active':'Inactive'}</span></td>
        <td class="admin-table-actions">
          ${u.id !== Store.getProfile()?.id ? `
            <button class="admin-btn admin-btn--ghost admin-btn--sm" data-role="${u.id}">Change Role</button>
            <button class="admin-btn admin-btn--ghost admin-btn--sm ${u.is_active?'admin-btn--danger-text':''}" data-toggle="${u.id}" data-active="${u.is_active}">
              ${u.is_active ? 'Deactivate' : 'Activate'}
            </button>
          ` : '<span class="admin-btn admin-btn--ghost admin-btn--sm" style="opacity:0.5" disabled>You</span>'}
        </td>
      </tr>`).join('')}</tbody>
    </table></div>`;

  // Add admin modal
  c.querySelector('#adm-add').addEventListener('click', () => {
    const modal = showModal('Add Administrator', `
      <form id="adm-add-form">
        ${field({ name: 'full_name', label: 'Full Name', required: true })}
        ${field({ name: 'email', label: 'Email', type: 'email', required: true })}
        ${field({ name: 'password', label: 'Temporary Password', type: 'password', required: true, help: 'The user will need to set their own password later.' })}
        ${selectField({ name: 'role', label: 'Role', value: 'editor', options: ROLES })}
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn--secondary" type="button" class="modal-close-btn">Cancel</button>
          <button class="admin-btn admin-btn--primary" type="submit">Create Account</button>
        </div>
      </form>
    `, { wide: false });

    modal.el.querySelector('.modal-close-btn')?.addEventListener('click', () => modal.close());
    modal.el.querySelector('#adm-add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        await Auth.createAdmin(data.email, data.password, data.full_name, data.role);
        showToast('Administrator created!', 'success');
        modal.close();
        renderList(c);
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    });
  });

  // Change role
  c.querySelectorAll('[data-role]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.role;
      const currentRole = data.find(u => u.id === userId)?.role;
      const newRole = prompt('Change role to (editor/admin/super_admin):', currentRole);
      if (newRole && newRole !== currentRole && ['editor','admin','super_admin'].includes(newRole)) {
        try {
          await Auth.updateProfileRole(userId, newRole);
          showToast('Role updated.', 'success');
          renderList(c);
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
      }
    });
  });

  // Toggle active
  c.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.toggle;
      const isActive = btn.dataset.active === 'true';
      const ok = await confirmDialog({
        title: isActive ? 'Deactivate User?' : 'Activate User?',
        message: isActive ? 'This user will no longer be able to log in.' : 'This user will be able to log in again.',
        confirmText: isActive ? 'Deactivate' : 'Activate',
        danger: isActive,
      });
      if (!ok) return;
      try {
        await Auth.toggleProfileActive(userId, !isActive);
        showToast(isActive ? 'User deactivated.' : 'User activated.', 'success');
        renderList(c);
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    });
  });
}

export async function renderEdit() {}
