// inspectionView.js - Pre/Post Rental Inspection Checklist & Digital Rental Agreement
const InspectionView = {
  currentBookingId: null,
  cachedBooking: null,

  // 1. DIGITAL RENTAL AGREEMENT
  async viewAgreement(bookingId) {
    try {
      const res = await API.getAgreement(bookingId);
      const data = res.data;
      const b = data.booking;
      const eq = data.equipment || {};

      const content = document.getElementById('agreementModalContent');
      if (!content) return;

      content.innerHTML = `
        <div id="printableAgreementArea" class="bg-white p-6 sm:p-8 rounded-2xl text-slate-800 space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-800 text-white font-black rounded-xl flex items-center justify-center text-xl">🚜</div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">AGRIRENT AGRICULTURAL MACHINERY LEASE AGREEMENT</h2>
                <div class="text-xs text-slate-500 font-mono">Contract Ref: ${data.contractId} • Date: ${data.date}</div>
              </div>
            </div>
            <div class="text-right no-print">
              <button onclick="window.print()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                <span>🖨️ Print Agreement</span>
              </button>
            </div>
          </div>

          <!-- Parties Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <div class="font-bold text-slate-900 uppercase tracking-wider mb-1">LESSOR (EQUIPMENT OWNER)</div>
              <div><span class="text-slate-500">Name:</span> <span class="font-semibold text-slate-800">${b.ownerName}</span></div>
              <div><span class="text-slate-500">Contact:</span> ${b.ownerPhone}</div>
              <div><span class="text-slate-500">Location:</span> ${eq.location || 'Pune, Maharashtra'}</div>
            </div>

            <div>
              <div class="font-bold text-slate-900 uppercase tracking-wider mb-1">LESSEE (FARMER / RENTER)</div>
              <div><span class="text-slate-500">Name:</span> <span class="font-semibold text-slate-800">${b.farmerName}</span></div>
              <div><span class="text-slate-500">Contact:</span> ${b.farmerPhone}</div>
              <div><span class="text-slate-500">Field Operational Zone:</span> ${b.fieldAddress}</div>
            </div>
          </div>

          <!-- Equipment & Schedule Table -->
          <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table class="w-full text-left divide-y divide-slate-200">
              <thead class="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th class="p-3">Equipment Specification</th>
                  <th class="p-3">Category / HP</th>
                  <th class="p-3">Rental Schedule</th>
                  <th class="p-3 text-right">Total Rental Fee</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr>
                  <td class="p-3 font-semibold text-slate-900">${b.equipmentTitle}</td>
                  <td class="p-3">${eq.category || 'Machinery'} • ${eq.hp || 'Standard'} HP</td>
                  <td class="p-3">${Utils.formatDate(b.startDate)} to ${Utils.formatDate(b.endDate)} (${b.durationDays ? `${b.durationDays} Days` : `${b.durationHours} Hours`})</td>
                  <td class="p-3 text-right font-black text-slate-900">${Utils.formatCurrency(b.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial Breakdown Table -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <div class="flex justify-between text-slate-600"><span>Base Machine Rental:</span> <span>${Utils.formatCurrency(b.baseRent)}</span></div>
            <div class="flex justify-between text-slate-600"><span>Operator / Driver Provision:</span> <span>${b.withOperator ? Utils.formatCurrency(b.operatorTotal) : 'Self Operation'}</span></div>
            <div class="flex justify-between text-slate-600"><span>Field Delivery / Haulage:</span> <span>${b.deliveryNeeded ? Utils.formatCurrency(b.deliveryFee) : 'Self Pick-up'}</span></div>
            <div class="flex justify-between text-slate-600"><span>Platform Digital Assurance & Coverage:</span> <span>${Utils.formatCurrency(b.platformFee)}</span></div>
            <div class="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
              <span>Total Contract Value:</span>
              <span class="text-emerald-800">${Utils.formatCurrency(b.totalAmount)}</span>
            </div>
            <div class="flex justify-between text-slate-600 pt-1">
              <span>Refundable Security Deposit:</span>
              <span class="font-bold text-slate-700">${Utils.formatCurrency(b.depositRefundable)}</span>
            </div>
          </div>

          <!-- Legal Terms -->
          <div class="text-[11px] text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
            <div class="font-bold text-slate-800 uppercase tracking-wider mb-2">Standard Terms & Conditions</div>
            ${data.terms.map(t => `<p>${t}</p>`).join('')}
          </div>

          <!-- Signatures Section -->
          <div class="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
            <div class="text-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div class="font-bold text-slate-800 mb-6">Signed by Equipment Owner (Lessor)</div>
              <div class="font-serif italic text-emerald-800 text-base">✓ Digital Signature: ${b.ownerName}</div>
              <div class="text-[10px] text-slate-400 mt-1">Verified Digital Timestamp: ${b.createdAt.split('T')[0]}</div>
            </div>

            <div class="text-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div class="font-bold text-slate-800 mb-6">Signed by Farmer (Lessee)</div>
              <div class="font-serif italic text-emerald-800 text-base">✓ Digital Signature: ${b.farmerName}</div>
              <div class="text-[10px] text-slate-400 mt-1">Acknowledged on Booking Authorization</div>
            </div>
          </div>
        </div>
      `;

      Utils.openModal('agreementModal');
    } catch (err) {
      Utils.showToast('Could not load agreement: ' + err.message, 'error');
    }
  },

  // 2. PRE/POST INSPECTION CHECKLIST
  async openInspectionModal(bookingId) {
    try {
      this.currentBookingId = bookingId;
      const res = await API.getBookingById(bookingId);
      this.cachedBooking = res.data;
      const b = this.cachedBooking;
      const insp = b.inspection || {};

      const content = document.getElementById('inspectionModalContent');
      if (!content) return;

      const isPreDone = insp.preRentalDone;
      const isPostDone = insp.postRentalDone;

      content.innerHTML = `
        <div class="space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-xs font-mono text-slate-400">${b.bookingCode}</span>
              <h3 class="font-black text-slate-900 text-lg">${b.equipmentTitle}</h3>
              <p class="text-xs text-slate-500">Condition checklist before machinery deployment & after field return.</p>
            </div>
            ${Utils.getStatusBadge(b.status)}
          </div>

          <!-- Section 1: Pre-Rental Inspection (Field Handover) -->
          <div class="bg-slate-50 p-5 rounded-2xl border ${isPreDone ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full ${isPreDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'} flex items-center justify-center text-xs font-bold">1</span>
                <h4 class="font-bold text-slate-900 text-sm">Pre-Rental Handover Inspection</h4>
              </div>
              ${isPreDone ? '<span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">✓ Verified & Logged</span>' : '<span class="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">Pending Verification</span>'}
            </div>

            ${isPreDone ? `
              <div class="text-xs text-slate-700 space-y-2 bg-white p-3 rounded-xl border border-emerald-200">
                <div class="grid grid-cols-2 gap-2">
                  <div><span class="text-slate-400">Hour Meter Reading:</span> <b>${insp.preRentalMeterHours || 420.5} Hours</b></div>
                  <div><span class="text-slate-400">Initial Fuel Tank Level:</span> <b>${insp.preRentalFuelLevel || '100%'}</b></div>
                </div>
                <div><span class="text-slate-400">Field Condition Report:</span> ${insp.preRentalNotes || 'Equipment checked and certified fit for field duty.'}</div>
                <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  Signed by Owner & Farmer on ${Utils.formatDate(insp.preRentalTimestamp || b.createdAt)}
                </div>
              </div>
            ` : `
              <form id="preInspectionForm" onsubmit="InspectionView.submitPreInspection(event)" class="space-y-3 text-xs">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Engine Hour Meter Reading</label>
                    <input type="number" id="preMeterHours" step="0.1" required value="420.5" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600">
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Fuel Tank Level</label>
                    <select id="preFuelLevel" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600">
                      <option value="100% Full" selected>100% (Full Tank)</option>
                      <option value="75%">75% (Three Quarters)</option>
                      <option value="50%">50% (Half Tank)</option>
                      <option value="25%">25% (Quarter Tank)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Physical Condition & Checklist</label>
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <label class="flex items-center gap-2"><input type="checkbox" checked class="accent-emerald-600"> Engine Oil Clean</label>
                    <label class="flex items-center gap-2"><input type="checkbox" checked class="accent-emerald-600"> Tire Pressure & Tread OK</label>
                    <label class="flex items-center gap-2"><input type="checkbox" checked class="accent-emerald-600"> Hydraulics Operating</label>
                    <label class="flex items-center gap-2"><input type="checkbox" checked class="accent-emerald-600"> Safety Guards Installed</label>
                  </div>
                  <textarea id="preNotes" rows="2" class="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600" placeholder="Notes: scratches, attached implements, operator handover remarks..."></textarea>
                </div>

                <div class="flex items-center justify-between pt-2">
                  <label class="flex items-center gap-2 font-bold text-slate-800">
                    <input type="checkbox" id="preSignedBoth" required class="accent-emerald-600">
                    Both Owner & Farmer confirm machinery inspection
                  </label>
                  <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition">
                    Save Handover Report
                  </button>
                </div>
              </form>
            `}
          </div>

          <!-- Section 2: Post-Rental Inspection (Field Return & Security Deposit Clearance) -->
          <div class="bg-slate-50 p-5 rounded-2xl border ${isPostDone ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full ${isPostDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'} flex items-center justify-center text-xs font-bold">2</span>
                <h4 class="font-bold text-slate-900 text-sm">Post-Rental Return & Deposit Release</h4>
              </div>
              ${isPostDone ? '<span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">✓ Completed & Refunded</span>' : '<span class="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Upon Return</span>'}
            </div>

            ${isPostDone ? `
              <div class="text-xs text-slate-700 space-y-2 bg-white p-3 rounded-xl border border-emerald-200">
                <div class="grid grid-cols-2 gap-2">
                  <div><span class="text-slate-400">Return Hour Meter:</span> <b>${insp.postRentalMeterHours} Hours</b></div>
                  <div><span class="text-slate-400">Return Fuel Tank:</span> <b>${insp.postRentalFuelLevel}</b></div>
                </div>
                <div><span class="text-slate-400">Return Notes:</span> ${insp.postRentalNotes || 'Returned in good operating condition. No damage detected.'}</div>
                <div class="text-emerald-700 font-bold">
                  ✓ Refundable Security Deposit of ${Utils.formatCurrency(b.depositRefundable)} cleared & returned to Farmer.
                </div>
              </div>
            ` : `
              ${!isPreDone ? `
                <div class="text-xs text-slate-400 italic">
                  Post-rental inspection unlocks once initial handover inspection is completed.
                </div>
              ` : `
                <form id="postInspectionForm" onsubmit="InspectionView.submitPostInspection(event)" class="space-y-3 text-xs">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Final Hour Meter Reading</label>
                      <input type="number" id="postMeterHours" step="0.1" required value="${(insp.preRentalMeterHours || 420.5) + 16.5}" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600">
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Return Fuel Tank Level</label>
                      <select id="postFuelLevel" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600">
                        <option value="100% Full" selected>100% (Refueled to Full)</option>
                        <option value="75%">75% (Three Quarters)</option>
                        <option value="50%">50% (Half Tank)</option>
                        <option value="25%">25% (Quarter Tank)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Return Inspection Remarks</label>
                    <textarea id="postNotes" rows="2" class="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-emerald-600" placeholder="Machinery washed, blade wear normal, no structural damage."></textarea>
                  </div>

                  <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                    <div>
                      <div class="font-bold">Release Security Deposit</div>
                      <div class="text-[11px] text-emerald-700">${Utils.formatCurrency(b.depositRefundable)} will be released back to ${b.farmerName}</div>
                    </div>
                    <button type="submit" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm transition">
                      Verify & Release
                    </button>
                  </div>
                </form>
              `}
            `}
          </div>
        </div>
      `;

      Utils.openModal('inspectionModal');
    } catch (err) {
      Utils.showToast('Could not load inspection modal: ' + err.message, 'error');
    }
  },

  async submitPreInspection(e) {
    e.preventDefault();
    if (!this.currentBookingId) return;

    const meterHours = document.getElementById('preMeterHours').value;
    const fuelLevel = document.getElementById('preFuelLevel').value;
    const notes = document.getElementById('preNotes').value || 'Inspected and certified in prime working condition.';

    try {
      await API.submitInspection(this.currentBookingId, {
        type: 'pre',
        meterHours,
        fuelLevel,
        notes,
        signedByOwner: true,
        signedByFarmer: true
      });

      Utils.showToast('Pre-rental inspection logged! Machinery marked active in field.', 'success');
      this.openInspectionModal(this.currentBookingId);
      if (window.OwnerView) window.OwnerView.loadDashboard();
      if (window.FarmerView) window.FarmerView.loadFarmerBookings();
    } catch (err) {
      Utils.showToast('Failed to save inspection: ' + err.message, 'error');
    }
  },

  async submitPostInspection(e) {
    e.preventDefault();
    if (!this.currentBookingId) return;

    const meterHours = document.getElementById('postMeterHours').value;
    const fuelLevel = document.getElementById('postFuelLevel').value;
    const notes = document.getElementById('postNotes').value || 'Returned in satisfactory condition. Zero penalty.';

    try {
      await API.submitInspection(this.currentBookingId, {
        type: 'post',
        meterHours,
        fuelLevel,
        notes,
        signedByOwner: true,
        signedByFarmer: true
      });

      Utils.showToast('Post-rental inspection completed! Security deposit released.', 'success');
      this.openInspectionModal(this.currentBookingId);
      if (window.OwnerView) window.OwnerView.loadDashboard();
      if (window.FarmerView) window.FarmerView.loadFarmerBookings();
    } catch (err) {
      Utils.showToast('Failed to save inspection: ' + err.message, 'error');
    }
  }
};
