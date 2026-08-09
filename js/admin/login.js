
import { signIn, resetPassword } from './auth.js';
import { showToast } from './ui.js';

export function render(container) {
  container.innerHTML = `
    <div class="admin-login">
      <div class="admin-login-card">
        <div class="admin-login-logo">
          <img src="assets/icons/logo.png" alt="MeroKagaj" style="height:48px;border-radius:var(--radius-md)">
          <h1>MeroKagajpatra</h1>
          <p>Content Management</p>
        </div>
        <form id="admin-login-form">
          <div class="admin-field">
            <label class="admin-label" for="login-email">Email</label>
            <input class="admin-input" type="email" id="login-email" name="email" required placeholder="admin@example.com" autocomplete="email">
          </div>
          <div class="admin-field">
            <label class="admin-label" for="login-password">Password</label>
            <input class="admin-input" type="password" id="login-password" name="password" required placeholder="Enter password" autocomplete="current-password">
          </div>
          <div id="login-error" class="admin-alert admin-alert--error" style="display:none"></div>
          <button class="admin-btn admin-btn--primary admin-btn--block" type="submit" id="login-submit">Sign In</button>
          <button class="admin-btn admin-btn--ghost admin-btn--block" type="button" id="forgot-pw" style="margin-top:var(--space-3);font-size:var(--text-sm)">Forgot password?</button>
        </form>
        <p class="admin-login-footer">Independent informational platform. Not affiliated with the Government of Nepal.</p>
      </div>
    </div>`;

  const form = document.getElementById('admin-login-form');
  const errEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    try {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      await signIn(email, password);
      showToast('Welcome back!', 'success');
    } catch (err) {
      errEl.textContent = err.message || 'Login failed. Please check your credentials.';
      errEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  document.getElementById('forgot-pw').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
      errEl.textContent = 'Enter your email address first, then click "Forgot password".';
      errEl.style.display = 'block';
      return;
    }
    try {
      await resetPassword(email);
      showToast('Password reset email sent. Check your inbox.', 'success');
    } catch (err) {
      errEl.textContent = err.message || 'Could not send reset email.';
      errEl.style.display = 'block';
    }
  });
}
