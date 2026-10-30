// ownerView.js - Owner portal, equipment listing, requests approval, and earnings
const OwnerView = {
  activeTab: 'requests', // 'requests', 'machinery', 'earnings'
  cachedOwnerEquipment: [],
  cachedOwnerBookings: [],

  async init() {
    await this.loadDashboard();
  },

  setTab(tab) {
    this.activeTab = tab;
    ['requests', 'machinery', 'earnings'].forEach(t => {
      const btn = document.getElementById(`ownerTabBtn_${t}`);
      const pane = document.getElementById(`ownerPane_${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'px-4 py-2 font-bold text-sm text-emerald-800 border-b-2 border-emerald-700 whitespace-nowrap';
        } else {
          btn.className = 'px-4 py-2 font-medium text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap';
        }
      }
      if (pane) {
        pane.classList.toggle('hidden', t !== tab);
      }
    });

    if (tab === 'requests') this.renderRequests();
    if (tab === 'machinery') this.renderMachinery();
    if (tab === 'earnings') this.renderEarnings();
  },

  async loadDashboard() {
    const ownerId = Auth.currentUser ? Auth.currentUser.id : 'user_owner_1';

    try {
      // Load stats
      const [statsRes, eqRes, bkRes] = await Promise.all([
        API.getStats(ownerId, 'owner'),
        API.getEquipment({ ownerId }),
        API.getBookings({ ownerId })
      ]);

      const stats = statsRes.data || {};
      this.cachedOwnerEquipment = eqRes.data || [];
      this.cachedOwnerBookings = bkRes.data || [];

      // Update Top Metrics Cards
      const earnEl = document.getElementById('ownerTotalEarnings');
      if (earnEl) earnEl.textContent = Utils.formatCurrency(stats.totalEarnings || 0);

      const activeEl = document.getElementById('ownerActiveRentals');
      if (activeEl) activeEl.textContent = stats.activeRentals || 0;

      const pendingEl = document.getElementById('ownerPendingRequests');
      if (pendingEl) pendingEl.textContent = stats.pendingRequests || 0;

      const machCountEl = document.getElementById('ownerMachineryCount');
      if (machCountEl) machCountEl.textContent = stats.totalEquipment || 0;

      this.setTab(this.activeTab);
    } catch (err) {
      console.error('Failed to load owner dashboard:', err);
    }
  },

  // 1. RENTAL REQUESTS MANAGEMENT
  renderRequests() {
    const container = document.getElementById('ownerRequestsList');
    if (!container) return;

    if (this.cachedOwnerBookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <div class="text-3xl mb-2">📬</div>
          <h4 class="font-bold text-slate-800">No rental requests yet</h4>
          <p class="text-xs text-slate-500 mt-1">When local farmers request your machinery, they will appear here for instant approval.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        ${this.cachedOwnerBookings.map(b => this.renderRequestItem(b)).join('')}
      </div>
    `;
  },

  renderRequestItem(b) {
    const isPending = b.status === 'pending';
    const isConfirmed = b.status === 'confirmed';
    const isInProgress = b.status === 'in_progress';

    return `
      <div class="bg-white rounded-2xl border ${isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'} p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <img src="${b.equipmentImage}" class="w-14 h-14 rounded-xl object-cover border border-slate-200" alt="">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-slate-500">${b.bookingCode}</span>
                ${Utils.getStatusBadge(b.status)}
              </div>
              <h4 class="font-bold text-slate-900 text-sm mt-0.5">${b.equipmentTitle}</h4>
              <div class="text-xs text-slate-500">
                Farmer: <span class="font-bold text-slate-800">${b.farmerName}</span> (${b.farmerPhone})
              </div>
            </div>
          </div>

          <div class="text-left sm:text-right">
            <div class="text-xs text-slate-400">Total Net Payout</div>
            <div class="text-lg font-black text-emerald-800">${Utils.formatCurrency(b.subtotal)}</div>
            <div class="text-xs text-slate-500">${b.durationDays ? `${b.durationDays} Days` : `${b.durationHours} Hours`} rental</div>
          </div>
        </div>

        <!-- Request Details -->
        <div class="py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 border-b border-slate-100">
          <div><span class="text-slate-400 block">Dates:</span><span class="font-semibold text-slate-800">${Utils.formatDate(b.startDate)} to ${Utils.formatDate(b.endDate)}</span></div>
          <div><span class="text-slate-400 block">Driver Included:</span><span class="font-semibold text-slate-800">${b.withOperator ? 'Yes (+₹' + b.operatorTotal + ')' : 'No'}</span></div>
          <div><span class="text-slate-400 block">Field Drop-off:</span><span class="font-semibold text-slate-800">${b.deliveryNeeded ? `Yes (${b.deliveryDistanceKm} km)` : 'Self-pickup'}</span></div>
          <div><span class="text-slate-400 block">Field Note:</span><span class="font-semibold text-slate-800 truncate block">${b.fieldAddress}</span></div>
        </div>

        <!-- Pipeline Action Buttons -->
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <!-- Inspection checklist -->
            <button onclick="InspectionView.openInspectionModal('${b.id}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
              <span>🔍 ${b.inspection && b.inspection.preRentalDone ? 'Inspection Log' : 'Start Inspection'}</span>
            </button>

            <!-- View Agreement -->
            <button onclick="InspectionView.viewAgreement('${b.id}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
              📄 Agreement
            </button>

            <!-- Chat with Farmer -->
            <button onclick="ChatView.startChatWithFarmer('${b.farmerId}', '${b.farmerName}', '${b.equipmentId}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
              💬 Message Farmer
            </button>
          </div>

          <!-- Status Action Triggers -->
          <div class="flex gap-2">
            ${isPending ? `
              <button onclick="OwnerView.updateBookingStatus('${b.id}', 'confirmed')" 
                      class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                ✓ Accept & Confirm
              </button>
              <button onclick="OwnerView.updateBookingStatus('${b.id}', 'cancelled')" 
                      class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition">
                ✕ Decline
              </button>
            ` : ''}

            ${isConfirmed ? `
              <button onclick="OwnerView.updateBookingStatus('${b.id}', 'in_progress')" 
                      class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                🚜 Mark In-Field (Active)
              </button>
            ` : ''}

            ${isInProgress ? `
              <button onclick="OwnerView.updateBookingStatus('${b.id}', 'completed')" 
                      class="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition">
                ✅ Complete & Release Deposit
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async updateBookingStatus(bookingId, newStatus) {
    try {
      await API.updateBookingStatus(bookingId, newStatus);
      Utils.showToast(`Booking marked as ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
      await this.loadDashboard();
    } catch (err) {
      Utils.showToast('Could not update booking: ' + err.message, 'error');
    }
  },

  // 2. MACHINERY MANAGEMENT
  renderMachinery() {
    const container = document.getElementById('ownerMachineryList');
    if (!container) return;

    if (this.cachedOwnerEquipment.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <div class="text-3xl mb-2">🚜</div>
          <h4 class="font-bold text-slate-800">You have no machinery listed yet</h4>
          <p class="text-xs text-slate-500 mt-1">Start earning daily rental income from your tractors, rotavators, or harvesters.</p>
          <button onclick="OwnerView.openAddEquipmentModal()" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition">
            + List Your First Equipment
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${this.cachedOwnerEquipment.map(eq => `
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div class="relative h-44 bg-slate-100">
                <img src="${eq.images[0]}" class="w-full h-full object-cover" alt="">
                <div class="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  ${eq.category}
                </div>
                <div class="absolute top-3 right-3">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${eq.availabilityStatus === 'available' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}">
                    ${eq.availabilityStatus === 'available' ? '● Available' : 'In Service'}
                  </span>
                </div>
              </div>

              <div class="p-4">
                <h4 class="font-bold text-slate-900 text-sm line-clamp-1">${eq.title}</h4>
                <div class="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>${eq.hp > 0 ? eq.hp + ' HP • ' : ''}${eq.brand}</span>
                  <span class="font-bold text-slate-800">${Utils.formatCurrency(eq.dailyRate)}/day</span>
                </div>
                
                <div class="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span>Rating: ★ ${eq.rating || '5.0'} (${eq.reviewCount || 0})</span>
                  <span>Deposit: ${Utils.formatCurrency(eq.securityDeposit)}</span>
                </div>
              </div>
            </div>

            <div class="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
              <button onclick="OwnerView.toggleAvailability('${eq.id}', '${eq.availabilityStatus}')" 
                      class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                ${eq.availabilityStatus === 'available' ? 'Set Maintenance' : 'Set Available'}
              </button>
              
              <button onclick="OwnerView.deleteEquipment('${eq.id}')" 
                      class="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 transition">
                Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async toggleAvailability(eqId, currentStatus) {
    const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    try {
      await API.updateEquipment(eqId, { availabilityStatus: newStatus });
      Utils.showToast(`Machinery marked as ${newStatus}`, 'info');
      await this.loadDashboard();
    } catch (err) {
      Utils.showToast('Error updating status: ' + err.message, 'error');
    }
  },

  async deleteEquipment(eqId) {
    if (!confirm('Are you sure you want to remove this equipment listing?')) return;
    try {
      await API.deleteEquipment(eqId);
      Utils.showToast('Equipment removed successfully', 'success');
      await this.loadDashboard();
    } catch (err) {
      Utils.showToast('Error removing equipment: ' + err.message, 'error');
    }
  },

  // 3. EARNINGS BREAKDOWN
  renderEarnings() {
    const container = document.getElementById('ownerEarningsDetails');
    if (!container) return;

    const completedBookings = this.cachedOwnerBookings.filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'in_progress');
    const totalEarned = completedBookings.reduce((sum, b) => sum + (b.subtotal || 0), 0);
    const totalOperatorEarned = completedBookings.reduce((sum, b) => sum + (b.operatorTotal || 0), 0);
    const totalDeliveryEarned = completedBookings.reduce((sum, b) => sum + (b.deliveryFee || 0), 0);

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Machinery Rent</div>
          <div class="text-2xl font-black text-emerald-950 mt-1">${Utils.formatCurrency(totalEarned - totalOperatorEarned - totalDeliveryEarned)}</div>
          <div class="text-xs text-emerald-700 mt-1">Direct equipment utilization</div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div class="text-xs font-bold text-blue-800 uppercase tracking-wider">Driver / Operator Payouts</div>
          <div class="text-2xl font-black text-blue-950 mt-1">${Utils.formatCurrency(totalOperatorEarned)}</div>
          <div class="text-xs text-blue-700 mt-1">Skilled labor compensation</div>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div class="text-xs font-bold text-amber-800 uppercase tracking-wider">Field Delivery Fees</div>
          <div class="text-2xl font-black text-amber-950 mt-1">${Utils.formatCurrency(totalDeliveryEarned)}</div>
          <div class="text-xs text-amber-700 mt-1">Fuel and transit reimbursement</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
          Rental Payout Log (${completedBookings.length} bookings)
        </div>
        <div class="divide-y divide-slate-100 text-xs">
          ${completedBookings.map(b => `
            <div class="p-4 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900">${b.equipmentTitle}</div>
                <div class="text-slate-500 text-[11px]">Rented by ${b.farmerName} • ${b.durationDays ? `${b.durationDays} Days` : `${b.durationHours} Hours`}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-800 text-sm">+${Utils.formatCurrency(b.subtotal)}</div>
                <div class="text-slate-400 text-[10px]">${Utils.formatDate(b.startDate)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 4. ADD NEW EQUIPMENT MODAL & SUBMIT
  openAddEquipmentModal() {
    Utils.openModal('addEquipmentModal');
  },

  async handleAddEquipmentSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('saveEquipmentBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Listing Equipment...';
    }

    try {
      const owner = Auth.currentUser;
      const title = document.getElementById('eqTitle').value;
      const category = document.getElementById('eqCategory').value;
      const brand = document.getElementById('eqBrand').value;
      const model = document.getElementById('eqModel').value;
      const hp = Number(document.getElementById('eqHp').value || 0);
      const dailyRate = Number(document.getElementById('eqDailyRate').value);
      const hourlyRate = Number(document.getElementById('eqHourlyRate').value || Math.round(dailyRate / 6));
      const securityDeposit = Number(document.getElementById('eqDeposit').value || 2000);
      const hasOperator = document.getElementById('eqHasOperator').checked;
      const operatorRatePerDay = Number(document.getElementById('eqOperatorRate').value || 400);
      const deliveryAvailable = document.getElementById('eqDeliveryAvailable').checked;
      const location = document.getElementById('eqLocation').value || owner.location || 'Pune, Maharashtra';
      const featuresRaw = document.getElementById('eqFeatures').value;
      const description = document.getElementById('eqDescription').value;
      const imageUrl = document.getElementById('eqImageUrl').value || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800';

      const payload = {
        title,
        category,
        brand,
        model,
        hp,
        dailyRate,
        hourlyRate,
        securityDeposit,
        hasOperator,
        operatorRatePerDay,
        deliveryAvailable,
        location,
        features: featuresRaw.split('\n').filter(Boolean),
        description,
        images: [imageUrl],
        ownerId: owner.id,
        ownerName: owner.name,
        ownerPhone: owner.phone || '+91 98000 00000',
        instantBooking: true
      };

      await API.createEquipment(payload);
      Utils.closeModal('addEquipmentModal');
      Utils.showToast('🎉 Your equipment has been listed on the marketplace!', 'success');
      document.getElementById('addEquipmentForm').reset();
      await this.loadDashboard();
      if (window.FarmerView) {
        window.FarmerView.loadMarketplace();
      }
    } catch (err) {
      Utils.showToast('Failed to add equipment: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Publish Machinery Listing';
      }
    }
  }
};
