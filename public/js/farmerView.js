// farmerView.js - Marketplace browsing, filters, dynamic cost calculator, and farmer bookings
const FarmerView = {
  currentCategory: 'all',
  currentFilters: {
    search: '',
    maxRate: '',
    minHp: '',
    hasOperator: false,
    location: ''
  },
  selectedEquipment: null,
  cachedEquipmentList: [],

  async init() {
    this.bindEvents();
    await this.loadMarketplace();
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('marketSearchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.currentFilters.search = e.target.value.trim();
          this.loadMarketplace();
        }, 300);
      });
    }

    // Price range filter
    const maxRateSlider = document.getElementById('filterMaxRate');
    const maxRateLabel = document.getElementById('filterMaxRateLabel');
    if (maxRateSlider) {
      maxRateSlider.addEventListener('input', (e) => {
        if (maxRateLabel) maxRateLabel.textContent = `₹${Number(e.target.value).toLocaleString('en-IN')}`;
        this.currentFilters.maxRate = e.target.value;
      });
      maxRateSlider.addEventListener('change', () => this.loadMarketplace());
    }

    // Min HP filter
    const minHpInput = document.getElementById('filterMinHp');
    if (minHpInput) {
      minHpInput.addEventListener('change', (e) => {
        this.currentFilters.minHp = e.target.value;
        this.loadMarketplace();
      });
    }

    // Has Operator toggle
    const operatorToggle = document.getElementById('filterHasOperator');
    if (operatorToggle) {
      operatorToggle.addEventListener('change', (e) => {
        this.currentFilters.hasOperator = e.target.checked;
        this.loadMarketplace();
      });
    }
  },

  setCategory(cat) {
    this.currentCategory = cat;
    // Update category pills UI
    document.querySelectorAll('.cat-pill').forEach(btn => {
      if (btn.dataset.category === cat) {
        btn.className = 'cat-pill px-4 py-2 rounded-full text-sm font-semibold bg-emerald-700 text-white shadow-sm transition whitespace-nowrap';
      } else {
        btn.className = 'cat-pill px-4 py-2 rounded-full text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition whitespace-nowrap';
      }
    });
    this.loadMarketplace();
  },

  async loadMarketplace() {
    const grid = document.getElementById('equipmentGrid');
    const countEl = document.getElementById('equipmentCountLabel');
    if (!grid) return;

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <svg class="animate-spin w-8 h-8 mx-auto text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        Finding available farm machinery...
      </div>
    `;

    try {
      const params = {
        category: this.currentCategory,
        search: this.currentFilters.search,
        maxRate: this.currentFilters.maxRate,
        minHp: this.currentFilters.minHp,
        hasOperator: this.currentFilters.hasOperator ? 'true' : ''
      };

      const res = await API.getEquipment(params);
      this.cachedEquipmentList = res.data || [];

      if (countEl) {
        countEl.textContent = `${this.cachedEquipmentList.length} machines available`;
      }

      if (this.cachedEquipmentList.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div class="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl">🚜</div>
            <h3 class="text-lg font-bold text-slate-800">No machinery matched your filters</h3>
            <p class="text-slate-500 text-sm mt-1 max-w-md mx-auto">Try lowering the minimum HP, widening the price budget, or resetting filters.</p>
            <button onclick="FarmerView.resetFilters()" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
              Reset All Filters
            </button>
          </div>
        `;
        return;
      }

      grid.innerHTML = this.cachedEquipmentList.map(item => this.renderEquipmentCard(item)).join('');
    } catch (err) {
      grid.innerHTML = `<div class="col-span-full text-center text-rose-600 py-8">Failed to load equipment: ${err.message}</div>`;
    }
  },

  resetFilters() {
    this.currentCategory = 'all';
    this.currentFilters = { search: '', maxRate: '', minHp: '', hasOperator: false, location: '' };
    const searchInput = document.getElementById('marketSearchInput');
    if (searchInput) searchInput.value = '';
    const operatorToggle = document.getElementById('filterHasOperator');
    if (operatorToggle) operatorToggle.checked = false;
    const minHpInput = document.getElementById('filterMinHp');
    if (minHpInput) minHpInput.value = '';
    this.setCategory('all');
  },

  renderEquipmentCard(eq) {
    const isAvailable = eq.availabilityStatus === 'available';
    const primaryImg = eq.images && eq.images[0] ? eq.images[0] : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800';

    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover-shadow flex flex-col group">
        <!-- Image & Badges -->
        <div class="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
          <img src="${primaryImg}" alt="${eq.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
          
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 backdrop-blur">
              ${eq.category}
            </span>
            ${eq.hp > 0 ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-sm backdrop-blur">${eq.hp} HP</span>` : ''}
          </div>

          <div class="absolute top-3 right-3 flex items-center gap-1">
            ${eq.instantBooking ? `
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                ⚡ Instant
              </span>
            ` : ''}
          </div>

          <div class="absolute bottom-3 left-3">
            <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur flex items-center gap-1">
              📍 ${eq.location.split(',')[0]}
            </span>
          </div>
        </div>

        <!-- Details -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span class="font-semibold text-slate-700">${eq.brand}</span>
              <span class="flex items-center gap-1 text-amber-600 font-bold">
                ★ ${eq.rating || '5.0'} <span class="text-slate-400 font-normal">(${eq.reviewCount || 0})</span>
              </span>
            </div>

            <h3 class="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-emerald-700 transition cursor-pointer" onclick="FarmerView.openDetailModal('${eq.id}')">
              ${eq.title}
            </h3>

            <div class="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-600">
              ${eq.hasOperator ? '<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">👨‍🌾 Driver Available</span>' : '<span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Machine Only</span>'}
              ${eq.deliveryAvailable ? '<span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">🚚 Delivery to Farm</span>' : ''}
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-500">Rent from</div>
              <div class="text-lg font-black text-slate-900">
                ${Utils.formatCurrency(eq.dailyRate)}<span class="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <div class="text-xs text-slate-400">or ${Utils.formatCurrency(eq.hourlyRate)}/hr</div>
            </div>

            <button onclick="FarmerView.openDetailModal('${eq.id}')" 
                    class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-1.5">
              <span>View & Rent</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async openDetailModal(eqId) {
    try {
      const res = await API.getEquipmentById(eqId);
      this.selectedEquipment = res.data;
      const reviews = res.reviews || [];

      const modalContent = document.getElementById('equipmentDetailModalContent');
      if (!modalContent) return;

      const eq = this.selectedEquipment;
      const isOwnerView = Auth.currentUser && Auth.currentUser.id === eq.ownerId;

      modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left Column: Gallery & Details -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Main Image -->
            <div class="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
              <img id="detailMainImg" src="${eq.images[0]}" alt="${eq.title}" class="w-full h-full object-cover">
              <div class="absolute top-4 left-4 flex gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-950/80 text-emerald-300 backdrop-blur">
                  ${eq.category}
                </span>
                ${eq.hp > 0 ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 shadow">${eq.hp} HP</span>` : ''}
              </div>
            </div>

            <!-- Thumbnail Selector -->
            ${eq.images && eq.images.length > 1 ? `
              <div class="flex gap-2 overflow-x-auto pb-1">
                ${eq.images.map((img, idx) => `
                  <button onclick="document.getElementById('detailMainImg').src='${img}'" class="w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-600 focus:border-emerald-600 flex-shrink-0">
                    <img src="${img}" class="w-full h-full object-cover">
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Title & Description -->
            <div>
              <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <span class="font-semibold text-slate-700">${eq.brand}</span> • <span>${eq.model}</span>
                • <span>📍 ${eq.location}</span>
              </div>
              <h2 class="text-2xl font-black text-slate-900">${eq.title}</h2>
              <p class="text-slate-600 text-sm mt-3 leading-relaxed">${eq.description}</p>
            </div>

            <!-- Key Specs / Features -->
            <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Key Features & Technical Specs</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                ${eq.features.map(f => `
                  <div class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>${f}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-4 text-xs text-slate-600">
                <div><span class="font-semibold text-slate-800">Best for:</span> ${eq.suitableFor}</div>
                <div><span class="font-semibold text-slate-800">Condition:</span> ${eq.condition}</div>
                <div><span class="font-semibold text-slate-800">Fuel Policy:</span> ${eq.fuelPolicy}</div>
                <div><span class="font-semibold text-slate-800">Security Deposit:</span> ${Utils.formatCurrency(eq.securityDeposit)} (100% Refundable)</div>
              </div>
            </div>

            <!-- Owner Profile Card -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  ${eq.ownerName.charAt(0)}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-900">${eq.ownerName}</h4>
                    <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Verified Owner</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">
                    ★ ${eq.ownerRating || '4.9'} • Fast responder • Contact: ${eq.ownerPhone}
                  </div>
                </div>
              </div>

              ${!isOwnerView ? `
                <button onclick="ChatView.startChatWithOwner('${eq.ownerId}', '${eq.ownerName}', '${eq.id}')" 
                        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <span>Chat Owner</span>
                </button>
              ` : ''}
            </div>

            <!-- Customer Reviews -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-slate-900 text-base">Reviews (${reviews.length})</h4>
                <span class="text-amber-600 font-bold text-sm">★ ${eq.rating || '5.0'} / 5.0</span>
              </div>
              <div class="space-y-3">
                ${reviews.length === 0 ? '<div class="text-xs text-slate-400">No reviews yet for this machine. Be the first to rent!</div>' : ''}
                ${reviews.map(r => `
                  <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-bold text-slate-800">${r.authorName}</span>
                      <span class="text-amber-500 font-semibold">${'★'.repeat(r.rating)}</span>
                    </div>
                    <p class="text-slate-600">${r.comment}</p>
                    <div class="text-slate-400 text-[10px] mt-1">${r.date}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive Booking Calculator -->
          <div class="lg:col-span-5">
            <div class="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5">
              <div class="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <div class="text-xs text-slate-500">Rental Price</div>
                  <div class="text-3xl font-black text-slate-900">
                    ${Utils.formatCurrency(eq.dailyRate)}<span class="text-sm font-normal text-slate-500">/day</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-slate-500">Hourly Rate</div>
                  <div class="text-lg font-bold text-slate-700">${Utils.formatCurrency(eq.hourlyRate)}/hr</div>
                </div>
              </div>

              <!-- Rental Form Calculator -->
              <form id="bookingCalculatorForm" onsubmit="FarmerView.handleBookingSubmit(event)">
                <div class="space-y-4 text-sm">
                  <!-- Duration Type (Days vs Hours) -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Rental Duration Unit</label>
                    <div class="grid grid-cols-2 gap-2">
                      <label class="cursor-pointer">
                        <input type="radio" name="rentalType" value="days" checked onchange="FarmerView.recalculatePricing()" class="peer sr-only">
                        <div class="py-2 text-center rounded-xl border border-slate-200 font-semibold peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">
                          Per Day
                        </div>
                      </label>
                      <label class="cursor-pointer">
                        <input type="radio" name="rentalType" value="hours" onchange="FarmerView.recalculatePricing()" class="peer sr-only">
                        <div class="py-2 text-center rounded-xl border border-slate-200 font-semibold peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">
                          Per Hour
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Date & Count Picker -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                      <input type="date" id="bookStartDate" required 
                             min="${new Date().toISOString().split('T')[0]}" 
                             value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}"
                             onchange="FarmerView.recalculatePricing()"
                             class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 font-medium">
                    </div>
                    <div>
                      <label id="durationCountLabel" class="block text-xs font-bold text-slate-700 uppercase mb-1">Number of Days</label>
                      <input type="number" id="bookDuration" min="1" max="60" value="2" required 
                             onchange="FarmerView.recalculatePricing()"
                             onkeyup="FarmerView.recalculatePricing()"
                             class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 font-medium">
                    </div>
                  </div>

                  <!-- Operator / Driver Checkbox -->
                  ${eq.hasOperator ? `
                    <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                      <label class="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" id="bookWithOperator" 
                               ${eq.operatorMandatory ? 'checked disabled' : 'checked'} 
                               onchange="FarmerView.recalculatePricing()" 
                               class="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500">
                        <div>
                          <div class="font-bold text-slate-900 text-xs sm:text-sm">
                            Include Certified Driver / Operator
                            ${eq.operatorMandatory ? '<span class="text-rose-600 text-xs font-semibold">(Mandatory for this unit)</span>' : ''}
                          </div>
                          <div class="text-xs text-blue-800 mt-0.5">
                            +${Utils.formatCurrency(eq.operatorRatePerDay)} per day (Fuel & skilled operation included)
                          </div>
                        </div>
                      </label>
                    </div>
                  ` : ''}

                  <!-- Farm Delivery Checkbox -->
                  ${eq.deliveryAvailable ? `
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="bookWithDelivery" checked onchange="FarmerView.recalculatePricing()" class="w-4 h-4 text-emerald-600 rounded">
                        <span class="font-bold text-slate-900 text-xs sm:text-sm">Deliver direct to my farm field</span>
                      </label>

                      <div id="deliveryDistanceContainer" class="flex items-center gap-3 pt-1 text-xs text-slate-600">
                        <label>Distance: <span id="deliveryKmLabel" class="font-bold text-slate-800">12 km</span></label>
                        <input type="range" id="bookDeliveryKm" min="1" max="60" value="12" 
                               oninput="document.getElementById('deliveryKmLabel').textContent = this.value + ' km'; FarmerView.recalculatePricing();"
                               class="flex-1 accent-emerald-600">
                      </div>
                    </div>
                  ` : ''}

                  <!-- Farm Field Address & Purpose -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Field Location & Farm Notes</label>
                    <input type="text" id="bookFieldAddress" required 
                           value="${Auth.currentUser && Auth.currentUser.location ? Auth.currentUser.location : 'Survey 22, Manjri, Pune'}" 
                           placeholder="Enter survey number or landmark for equipment drop-off"
                           class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600">
                  </div>
                </div>

                <!-- Price Breakdown Summary -->
                <div class="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div class="flex justify-between text-slate-600">
                    <span id="breakdownBaseRentLabel">Base Equipment Rent:</span>
                    <span id="breakdownBaseRentVal" class="font-semibold text-slate-800">₹0</span>
                  </div>
                  <div class="flex justify-between text-slate-600" id="breakdownOperatorRow">
                    <span>Operator / Driver Fee:</span>
                    <span id="breakdownOperatorVal" class="font-semibold text-slate-800">₹0</span>
                  </div>
                  <div class="flex justify-between text-slate-600" id="breakdownDeliveryRow">
                    <span>Field Transport & Delivery:</span>
                    <span id="breakdownDeliveryVal" class="font-semibold text-slate-800">₹0</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Platform Insurance & Tech Fee (3%):</span>
                    <span id="breakdownPlatformVal" class="font-semibold text-slate-800">₹0</span>
                  </div>
                  
                  <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                    <span>Total Estimated Rental:</span>
                    <span id="breakdownTotalVal" class="text-xl font-black text-emerald-800">₹0</span>
                  </div>

                  <div class="pt-2 border-t border-dashed border-slate-300 flex justify-between text-[11px] text-slate-500">
                    <span>Refundable Security Deposit:</span>
                    <span id="breakdownDepositVal" class="font-semibold text-slate-700">${Utils.formatCurrency(eq.securityDeposit)}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 italic">
                    * Deposit is fully returned upon machinery return after post-rental inspection.
                  </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitBookingBtn"
                        class="w-full mt-4 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
                  <span>Confirm Rental Booking</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>

                <div class="text-center text-[11px] text-slate-400 mt-2">
                  🔒 Includes Digital Rental Agreement & Inspection Guarantee
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      Utils.openModal('equipmentDetailModal');
      this.recalculatePricing();
    } catch (err) {
      Utils.showToast('Could not load equipment details: ' + err.message, 'error');
    }
  },

  recalculatePricing() {
    if (!this.selectedEquipment) return;
    const eq = this.selectedEquipment;

    const rentalTypeRadio = document.querySelector('input[name="rentalType"]:checked');
    const rentalType = rentalTypeRadio ? rentalTypeRadio.value : 'days';

    const durationInput = document.getElementById('bookDuration');
    const duration = Math.max(1, Number(durationInput ? durationInput.value : 1));

    const durationLabel = document.getElementById('durationCountLabel');
    if (durationLabel) {
      durationLabel.textContent = rentalType === 'days' ? 'Number of Days' : 'Number of Hours';
    }

    // Rate calculations
    const rateApplied = rentalType === 'days' ? eq.dailyRate : eq.hourlyRate;
    const baseRent = rateApplied * duration;

    // Operator
    const withOperatorCheck = document.getElementById('bookWithOperator');
    const withOperator = withOperatorCheck ? withOperatorCheck.checked : false;
    const operatorRate = withOperator ? (eq.operatorRatePerDay || 400) : 0;
    const operatorTotal = withOperator ? (rentalType === 'days' ? operatorRate * duration : Math.round(operatorRate / 6 * duration)) : 0;

    // Delivery
    const withDeliveryCheck = document.getElementById('bookWithDelivery');
    const withDelivery = withDeliveryCheck ? withDeliveryCheck.checked : false;
    const deliveryDistanceKm = withDelivery ? Number(document.getElementById('bookDeliveryKm')?.value || 10) : 0;
    const deliveryTotal = withDelivery ? deliveryDistanceKm * (eq.deliveryChargePerKm || 25) : 0;

    // Subtotal & Platform Fee
    const subtotal = baseRent + operatorTotal + deliveryTotal;
    const platformFee = Math.round(subtotal * 0.03) + 50;
    const total = subtotal + platformFee;

    // Update UI Elements
    const baseRentLabel = document.getElementById('breakdownBaseRentLabel');
    if (baseRentLabel) baseRentLabel.textContent = `Base Rent (${duration} ${rentalType}):`;

    const baseRentVal = document.getElementById('breakdownBaseRentVal');
    if (baseRentVal) baseRentVal.textContent = Utils.formatCurrency(baseRent);

    const operatorRow = document.getElementById('breakdownOperatorRow');
    const operatorVal = document.getElementById('breakdownOperatorVal');
    if (operatorRow && operatorVal) {
      if (withOperator) {
        operatorRow.classList.remove('hidden');
        operatorVal.textContent = Utils.formatCurrency(operatorTotal);
      } else {
        operatorRow.classList.add('hidden');
      }
    }

    const deliveryRow = document.getElementById('breakdownDeliveryRow');
    const deliveryVal = document.getElementById('breakdownDeliveryVal');
    if (deliveryRow && deliveryVal) {
      if (withDelivery) {
        deliveryRow.classList.remove('hidden');
        deliveryVal.textContent = Utils.formatCurrency(deliveryTotal);
      } else {
        deliveryRow.classList.add('hidden');
      }
    }

    const platformVal = document.getElementById('breakdownPlatformVal');
    if (platformVal) platformVal.textContent = Utils.formatCurrency(platformFee);

    const totalVal = document.getElementById('breakdownTotalVal');
    if (totalVal) totalVal.textContent = Utils.formatCurrency(total);
  },

  async handleBookingSubmit(e) {
    e.preventDefault();
    if (!this.selectedEquipment) return;
    const eq = this.selectedEquipment;

    const btn = document.getElementById('submitBookingBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>`;
    }

    try {
      const rentalType = document.querySelector('input[name="rentalType"]:checked')?.value || 'days';
      const duration = Number(document.getElementById('bookDuration')?.value || 1);
      const startDate = document.getElementById('bookStartDate')?.value;
      const withOperator = document.getElementById('bookWithOperator')?.checked || false;
      const withDelivery = document.getElementById('bookWithDelivery')?.checked || false;
      const deliveryKm = withDelivery ? Number(document.getElementById('bookDeliveryKm')?.value || 10) : 0;
      const fieldAddress = document.getElementById('bookFieldAddress')?.value || '';

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start);
      if (rentalType === 'days') {
        end.setDate(end.getDate() + duration);
      } else {
        end.setHours(end.getHours() + duration);
      }
      const endDate = end.toISOString().split('T')[0];

      const farmer = Auth.currentUser || {
        id: 'user_farmer_1',
        name: 'Sunil Kadam',
        phone: '+91 98220 11223',
        location: 'Pune, Maharashtra'
      };

      const bookingPayload = {
        equipmentId: eq.id,
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmerPhone: farmer.phone || '+91 98220 11223',
        farmerLocation: farmer.location || '',
        rentalType,
        duration,
        startDate,
        endDate,
        withOperator,
        deliveryNeeded: withDelivery,
        deliveryDistanceKm: deliveryKm,
        fieldAddress,
        purpose: `Agricultural work on farm in ${farmer.location || 'Pune'}`
      };

      const res = await API.createBooking(bookingPayload);
      Utils.closeModal('equipmentDetailModal');
      Utils.showToast(`🎉 Booking ${res.data.bookingCode} requested successfully!`, 'success');

      // Switch to Farmer Bookings tab
      if (window.App) {
        window.App.switchView('farmer-bookings');
      }
    } catch (err) {
      Utils.showToast('Booking failed: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Confirm Rental Booking</span>`;
      }
    }
  },

  // ---------------------------------------------------------
  // FARMER BOOKINGS MANAGEMENT VIEW
  // ---------------------------------------------------------
  async loadFarmerBookings() {
    const container = document.getElementById('farmerBookingsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="py-16 text-center text-slate-400">
        <svg class="animate-spin w-8 h-8 mx-auto text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        Loading your rental history & active machinery...
      </div>
    `;

    try {
      const farmerId = Auth.currentUser ? Auth.currentUser.id : 'user_farmer_1';
      const res = await API.getBookings({ farmerId });
      const bookings = res.data || [];

      if (bookings.length === 0) {
        container.innerHTML = `
          <div class="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div class="w-16 h-16 mx-auto mb-3 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl">📋</div>
            <h3 class="text-lg font-bold text-slate-800">You haven't rented any equipment yet</h3>
            <p class="text-slate-500 text-sm mt-1">Browse through hundreds of tractors, harvesters, and drones in the marketplace.</p>
            <button onclick="App.switchView('marketplace')" class="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
              Explore Available Equipment
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="space-y-4">
          ${bookings.map(b => this.renderBookingCard(b)).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="text-center text-rose-600 py-8">Error loading bookings: ${err.message}</div>`;
    }
  },

  renderBookingCard(b) {
    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div class="flex items-center gap-4">
            <img src="${b.equipmentImage}" class="w-16 h-16 rounded-xl object-cover border border-slate-200" alt="${b.equipmentTitle}">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-slate-500">${b.bookingCode}</span>
                ${Utils.getStatusBadge(b.status)}
              </div>
              <h3 class="font-bold text-slate-900 text-base mt-0.5">${b.equipmentTitle}</h3>
              <div class="text-xs text-slate-500 mt-0.5">
                Owner: <span class="font-semibold text-slate-700">${b.ownerName}</span> (${b.ownerPhone})
              </div>
            </div>
          </div>

          <div class="text-left md:text-right">
            <div class="text-xs text-slate-500">Total Rental Cost</div>
            <div class="text-xl font-black text-slate-900">${Utils.formatCurrency(b.totalAmount)}</div>
            <div class="text-xs text-emerald-600 font-semibold">+ ${Utils.formatCurrency(b.depositRefundable)} Deposit</div>
          </div>
        </div>

        <!-- Schedule & Status Summary -->
        <div class="py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 border-b border-slate-100">
          <div>
            <span class="text-slate-400 block">Dates:</span>
            <span class="font-semibold text-slate-800">${Utils.formatDate(b.startDate)} → ${Utils.formatDate(b.endDate)}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Duration:</span>
            <span class="font-semibold text-slate-800">${b.durationDays ? `${b.durationDays} Days` : `${b.durationHours} Hours`}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Driver / Operator:</span>
            <span class="font-semibold text-slate-800">${b.withOperator ? 'Yes (Included)' : 'No (Self Drive)'}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Delivery:</span>
            <span class="font-semibold text-slate-800">${b.deliveryNeeded ? `Yes (${b.deliveryDistanceKm} km)` : 'Self Pickup'}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div class="flex flex-wrap gap-2">
            <!-- Rental Agreement -->
            <button onclick="InspectionView.viewAgreement('${b.id}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
              <span>📄 Rental Agreement</span>
            </button>

            <!-- Pre/Post Inspection Checklist -->
            <button onclick="InspectionView.openInspectionModal('${b.id}')" 
                    class="px-3 py-1.5 ${b.inspection && b.inspection.preRentalDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'} font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
              <span>🔍 ${b.inspection && b.inspection.preRentalDone ? 'Inspection Verified' : 'Complete Inspection'}</span>
            </button>

            <!-- Chat with Owner -->
            <button onclick="ChatView.startChatWithOwner('${b.ownerId}', '${b.ownerName}', '${b.equipmentId}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
              <span>💬 Message Owner</span>
            </button>
          </div>

          <!-- Review Button if completed -->
          ${b.status === 'completed' ? `
            <button onclick="FarmerView.openReviewModal('${b.equipmentId}', '${b.id}')" 
                    class="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition">
              ⭐ Write Equipment Review
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  openReviewModal(equipmentId, bookingId) {
    document.getElementById('reviewEquipmentId').value = equipmentId;
    document.getElementById('reviewBookingId').value = bookingId;
    document.getElementById('reviewComment').value = '';
    Utils.openModal('reviewModal');
  },

  async handleReviewSubmit(e) {
    e.preventDefault();
    const equipmentId = document.getElementById('reviewEquipmentId').value;
    const bookingId = document.getElementById('reviewBookingId').value;
    const rating = document.getElementById('reviewRatingSelect').value;
    const comment = document.getElementById('reviewComment').value;

    try {
      await API.createReview({
        equipmentId,
        bookingId,
        authorId: Auth.currentUser.id,
        authorName: Auth.currentUser.name,
        rating,
        comment
      });

      Utils.closeModal('reviewModal');
      Utils.showToast('Thank you! Review published successfully.', 'success');
      this.loadFarmerBookings();
    } catch (err) {
      Utils.showToast('Failed to post review: ' + err.message, 'error');
    }
  }
};
