// auth.js - User authentication, session, and role switching
const Auth = {
  currentUser: null,
  availableUsers: [],

  async init() {
    try {
      const res = await API.getDemoUsers();
      this.availableUsers = res.users || [];
      
      const savedUserStr = localStorage.getItem('agrirent_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        // Find fresh copy from users list or use saved
        const found = this.availableUsers.find(u => u.id === parsed.id);
        this.currentUser = found || parsed;
      } else {
        // Default to Sunil Kadam (Farmer)
        this.currentUser = this.availableUsers.find(u => u.id === 'user_farmer_1') || this.availableUsers[0];
        this.saveSession();
      }

      this.renderUserSwitchers();
      this.updateNavbarUser();
    } catch (e) {
      console.error('Failed to init auth:', e);
    }
  },

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem('agrirent_user', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('agrirent_user');
    }
  },

  switchUser(userId) {
    const user = this.availableUsers.find(u => u.id === userId);
    if (!user) return;
    this.currentUser = user;
    this.saveSession();
    this.updateNavbarUser();

    // Trigger app view updates
    Utils.showToast(`Switched active user to ${user.name} (${user.role.toUpperCase()})`, 'info');
    if (window.App && window.App.onUserChanged) {
      window.App.onUserChanged(user);
    }
  },

  switchRole(role) {
    const candidate = this.availableUsers.find(u => u.role === role);
    if (candidate) {
      this.switchUser(candidate.id);
    }
  },

  updateNavbarUser() {
    if (!this.currentUser) return;

    const nameEl = document.getElementById('navUserName');
    const roleEl = document.getElementById('navUserRole');
    const avatarEl = document.getElementById('navUserAvatar');
    const roleBadgeEl = document.getElementById('navRoleBadge');

    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (roleEl) roleEl.textContent = this.currentUser.role === 'owner' ? 'Equipment Owner' : 'Farmer / Renter';
    if (avatarEl) avatarEl.src = this.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    if (roleBadgeEl) {
      if (this.currentUser.role === 'owner') {
        roleBadgeEl.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            Equipment Owner
          </span>
        `;
      } else {
        roleBadgeEl.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Farmer / Renter
          </span>
        `;
      }
    }
  },

  renderUserSwitchers() {
    const container = document.getElementById('demoPersonaSelector');
    if (!container) return;

    container.innerHTML = this.availableUsers.map(u => `
      <button onclick="Auth.switchUser('${u.id}')" 
              class="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm hover:bg-slate-100 transition ${this.currentUser && this.currentUser.id === u.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'}">
        <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200" alt="${u.name}">
        <div class="flex-1 truncate">
          <div class="truncate">${u.name}</div>
          <div class="text-xs ${u.role === 'owner' ? 'text-amber-700' : 'text-emerald-700'}">
            ${u.role === 'owner' ? '🚜 Equipment Owner' : '🌾 Farmer'} • ${u.location.split(',')[0]}
          </div>
        </div>
        ${this.currentUser && this.currentUser.id === u.id ? '<span class="text-emerald-600 text-xs font-bold">Active</span>' : ''}
      </button>
    `).join('');
  }
};
