/**
 * CampusBite — Client Authentication Helper
 */
const Auth = {
  currentUser: null,

  async checkSession() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          Utils.setStorage(CONFIG.STORAGE_KEYS.USER, data.user);
          this.updateNavUI();
          return this.currentUser;
        }
      }
    } catch (e) {
      console.warn('Session check failed or offline', e);
    }
    this.currentUser = Utils.getStorage(CONFIG.STORAGE_KEYS.USER, null);
    this.updateNavUI();
    return this.currentUser;
  },

  updateNavUI() {
    const user = this.currentUser;
    const authContainer = document.getElementById('nav-user-area');
    if (!authContainer) return;

    if (user) {
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <a href="${user.role === 'admin' ? '/admin.html' : '/orders.html'}" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;">
            <span>👤</span>
            <span>${Utils.escapeHTML(user.name.split(' ')[0])}</span>
            ${user.role === 'admin' ? '<span class="badge badge-warning" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Admin</span>' : ''}
          </a>
          <button id="nav-logout-btn" class="btn btn-outline btn-sm">Logout</button>
        </div>
      `;

      const logoutBtn = document.getElementById('nav-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    } else {
      authContainer.innerHTML = `
        <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
  },

  async logout() {
    try {
      await fetch(`${CONFIG.API_BASE}/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    this.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    Utils.showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 400);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.checkSession();
});
