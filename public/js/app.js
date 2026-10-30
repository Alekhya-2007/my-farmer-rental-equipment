// app.js - Main Application Orchestrator and Router
const App = {
  currentView: 'marketplace',

  async init() {
    console.log('🌱 Initializing AgriRent Platform...');

    // 1. Initialize Auth
    await Auth.init();

    // 2. Initialize Views
    await FarmerView.init();
    await OwnerView.init();
    await ChatView.init();

    // 3. Bind Navigation & Global Events
    this.bindGlobalEvents();

    // 4. Default View based on user role
    if (Auth.currentUser && Auth.currentUser.role === 'owner') {
      this.switchView('owner-portal');
    } else {
      this.switchView('marketplace');
    }

    console.log('🚜 AgriRent ready.');
  },

  bindGlobalEvents() {
    // Navigation view buttons
    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.navView;
        this.switchView(view);
      });
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ['equipmentDetailModal', 'addEquipmentModal', 'agreementModal', 'inspectionModal', 'chatModal', 'reviewModal'].forEach(id => {
          Utils.closeModal(id);
        });
      }
    });

    // Reset Demo Database
    const resetBtn = document.getElementById('resetDemoDbBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (!confirm('Reset database back to default seed data? All custom bookings and listings will reset.')) return;
        try {
          await API.resetDemoDb();
          Utils.showToast('Database reset to initial demo seeds!', 'info');
          setTimeout(() => window.location.reload(), 600);
        } catch (e) {
          Utils.showToast('Reset failed: ' + e.message, 'error');
        }
      });
    }
  },

  switchView(viewName) {
    this.currentView = viewName;

    // Toggle Main Views
    const viewMarket = document.getElementById('viewMarketplace');
    const viewFarmerBookings = document.getElementById('viewFarmerBookings');
    const viewOwnerPortal = document.getElementById('viewOwnerPortal');

    if (viewMarket) viewMarket.classList.toggle('hidden', viewName !== 'marketplace');
    if (viewFarmerBookings) viewFarmerBookings.classList.toggle('hidden', viewName !== 'farmer-bookings');
    if (viewOwnerPortal) viewOwnerPortal.classList.toggle('hidden', viewName !== 'owner-portal');

    // Update Nav Link Active Highlights
    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      const isTarget = btn.dataset.navView === viewName;
      if (isTarget) {
        btn.classList.add('text-emerald-800', 'bg-emerald-50', 'font-bold');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('text-emerald-800', 'bg-emerald-50', 'font-bold');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    // Load data for specific view
    if (viewName === 'marketplace') {
      FarmerView.loadMarketplace();
    } else if (viewName === 'farmer-bookings') {
      FarmerView.loadFarmerBookings();
    } else if (viewName === 'owner-portal') {
      OwnerView.loadDashboard();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  onUserChanged(user) {
    if (user.role === 'owner') {
      this.switchView('owner-portal');
    } else {
      this.switchView('marketplace');
    }
  }
};

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.App = App;
  App.init();
});
