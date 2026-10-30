// api.js - Backend REST API client
const API = {
  baseUrl: window.location.origin,

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: options.body instanceof FormData ? undefined : headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  async getDemoUsers() {
    return this.request('/api/auth/users');
  },
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Equipment
  async getEquipment(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        query.append(k, v);
      }
    });
    return this.request(`/api/equipment?${query.toString()}`);
  },
  async getEquipmentById(id) {
    return this.request(`/api/equipment/${id}`);
  },
  async createEquipment(data) {
    return this.request('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateEquipment(id, data) {
    return this.request(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteEquipment(id) {
    return this.request(`/api/equipment/${id}`, {
      method: 'DELETE'
    });
  },
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Bookings
  async getBookings(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    return this.request(`/api/bookings?${query.toString()}`);
  },
  async getBookingById(id) {
    return this.request(`/api/bookings/${id}`);
  },
  async createBooking(data) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateBookingStatus(id, status) {
    return this.request(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Inspections & Agreements
  async submitInspection(bookingId, inspectionData) {
    return this.request(`/api/bookings/${bookingId}/inspection`, {
      method: 'POST',
      body: JSON.stringify(inspectionData)
    });
  },
  async getAgreement(bookingId) {
    return this.request(`/api/bookings/${bookingId}/agreement`);
  },

  // Messages & Chat
  async getConversations(userId) {
    return this.request(`/api/conversations?userId=${encodeURIComponent(userId)}`);
  },
  async getMessages(conversationId) {
    return this.request(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`);
  },
  async sendMessage(msgData) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(msgData)
    });
  },
  async markRead(conversationId, userId) {
    return this.request('/api/messages/read', {
      method: 'POST',
      body: JSON.stringify({ conversationId, userId })
    });
  },

  // Reviews
  async getReviews(equipmentId) {
    return this.request(`/api/reviews?equipmentId=${encodeURIComponent(equipmentId)}`);
  },
  async createReview(data) {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Dashboard Stats
  async getStats(userId, role) {
    return this.request(`/api/dashboard/stats?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`);
  },

  // Reset database demo
  async resetDemoDb() {
    return this.request('/api/db/reset', { method: 'POST' });
  }
};
