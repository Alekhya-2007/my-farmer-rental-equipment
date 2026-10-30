// utils.js - Formatting, helpers, and notifications
const Utils = {
  formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  },

  getStatusBadge(status) {
    const config = {
      pending: {
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'Awaiting Owner Approval',
        icon: 'clock'
      },
      confirmed: {
        bg: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'Booking Confirmed',
        icon: 'check-circle'
      },
      in_progress: {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'Active in Field',
        icon: 'activity'
      },
      completed: {
        bg: 'bg-gray-100 text-gray-800 border-gray-300',
        label: 'Completed & Returned',
        icon: 'check'
      },
      cancelled: {
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'Cancelled',
        icon: 'x-circle'
      }
    };

    const c = config[status] || {
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      label: status,
      icon: 'info'
    };

    return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg}">
      <span class="w-1.5 h-1.5 rounded-full ${status === 'in_progress' ? 'bg-emerald-600 live-pulse' : 'bg-current'}"></span>
      ${c.label}
    </span>`;
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-900/90 text-white border-emerald-500',
      error: 'bg-rose-900/90 text-white border-rose-500',
      info: 'bg-slate-900/90 text-white border-slate-600',
      warning: 'bg-amber-900/90 text-white border-amber-500'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur text-sm transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="flex-1">${message}</div>
      <button class="text-white/70 hover:text-white" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('overflow-hidden');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
    }
  }
};
