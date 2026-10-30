// chatView.js - In-app real-time messaging between Farmers and Equipment Owners
const ChatView = {
  activeConversation: null,
  activeEquipmentId: null,
  cachedConversations: [],
  pollTimer: null,

  async init() {
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('chatSendForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }
  },

  async openChatModal(conversationId = null) {
    Utils.openModal('chatModal');
    await this.loadConversations(conversationId);

    // Auto refresh chat messages every 4 seconds while modal is open
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (this.activeConversation) {
        this.loadMessages(this.activeConversation.conversationId, false);
      }
    }, 4000);
  },

  closeChatModal() {
    clearInterval(this.pollTimer);
    Utils.closeModal('chatModal');
  },

  async loadConversations(autoSelectConvId = null) {
    const listEl = document.getElementById('chatConversationsList');
    if (!listEl) return;

    const currentUserId = Auth.currentUser ? Auth.currentUser.id : 'user_farmer_1';

    try {
      const res = await API.getConversations(currentUserId);
      this.cachedConversations = res.data || [];

      if (this.cachedConversations.length === 0) {
        listEl.innerHTML = `
          <div class="p-6 text-center text-slate-400 text-xs">
            No conversations yet. Message an equipment owner or farmer to begin.
          </div>
        `;
        document.getElementById('chatMessagesThread').innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-sm">
            <div class="text-3xl mb-2">💬</div>
            Select or start a chat with an equipment owner or farmer.
          </div>
        `;
        return;
      }

      listEl.innerHTML = this.cachedConversations.map(c => `
        <button onclick="ChatView.selectConversation('${c.conversationId}')" 
                class="w-full text-left p-3 rounded-xl transition flex items-start gap-3 border ${this.activeConversation && this.activeConversation.conversationId === c.conversationId ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-transparent hover:bg-slate-50'}">
          <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-sm">
            ${c.otherUserName.charAt(0)}
          </div>
          <div class="flex-1 truncate">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs truncate">${c.otherUserName}</span>
              <span class="text-[10px] text-slate-400">${Utils.formatTime(c.lastMessage.timestamp)}</span>
            </div>
            <div class="text-[11px] text-emerald-700 font-semibold truncate mt-0.5">🚜 ${c.equipmentTitle}</div>
            <div class="text-xs text-slate-500 truncate mt-0.5">${c.lastMessage.text}</div>
          </div>
          ${c.unreadCount > 0 ? `<span class="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-2"></span>` : ''}
        </button>
      `).join('');

      // Auto select first or requested conversation
      const target = autoSelectConvId 
        ? this.cachedConversations.find(c => c.conversationId === autoSelectConvId) 
        : this.cachedConversations[0];

      if (target) {
        this.selectConversation(target.conversationId);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  },

  async selectConversation(conversationId) {
    const conv = this.cachedConversations.find(c => c.conversationId === conversationId);
    if (!conv) return;

    this.activeConversation = conv;
    this.activeEquipmentId = conv.equipmentId;

    // Update Header
    const titleEl = document.getElementById('chatHeaderTitle');
    const subtitleEl = document.getElementById('chatHeaderSubtitle');
    if (titleEl) titleEl.textContent = conv.otherUserName;
    if (subtitleEl) subtitleEl.textContent = `Inquiry regarding: ${conv.equipmentTitle}`;

    // Mark as read
    if (Auth.currentUser) {
      API.markRead(conversationId, Auth.currentUser.id);
    }

    await this.loadMessages(conversationId);
  },

  async loadMessages(conversationId, showSpinner = true) {
    const thread = document.getElementById('chatMessagesThread');
    if (!thread) return;

    if (showSpinner && (!thread.children.length || thread.innerText.includes('Select or start'))) {
      thread.innerHTML = `
        <div class="py-12 text-center text-slate-400 text-xs">
          Loading messages...
        </div>
      `;
    }

    try {
      const res = await API.getMessages(conversationId);
      const messages = res.data || [];
      const currentUserId = Auth.currentUser ? Auth.currentUser.id : '';

      thread.innerHTML = messages.map(m => {
        const isMe = m.senderId === currentUserId;
        return `
          <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3">
            <div class="text-[10px] text-slate-400 mb-0.5 px-1">${isMe ? 'You' : m.senderName} • ${Utils.formatTime(m.timestamp)}</div>
            <div class="max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${isMe ? 'bg-emerald-700 text-white rounded-br-none shadow-sm' : 'bg-slate-100 text-slate-800 rounded-bl-none'}">
              ${m.text}
            </div>
          </div>
        `;
      }).join('');

      // Auto scroll to bottom
      thread.scrollTop = thread.scrollHeight;
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  async handleSendMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input || !input.value.trim() || !this.activeConversation) return;

    const text = input.value.trim();
    input.value = '';

    const current = Auth.currentUser || { id: 'user_farmer_1', name: 'Sunil Kadam' };

    try {
      await API.sendMessage({
        conversationId: this.activeConversation.conversationId,
        equipmentId: this.activeEquipmentId || this.activeConversation.equipmentId,
        senderId: current.id,
        senderName: current.name,
        receiverId: this.activeConversation.otherUserId,
        receiverName: this.activeConversation.otherUserName,
        text
      });

      await this.loadMessages(this.activeConversation.conversationId, false);
      // Refresh conversation list preview
      const userRes = await API.getConversations(current.id);
      this.cachedConversations = userRes.data || [];
    } catch (err) {
      Utils.showToast('Could not send message: ' + err.message, 'error');
    }
  },

  // Start new chat with owner directly from equipment card or detail
  startChatWithOwner(ownerId, ownerName, equipmentId) {
    const current = Auth.currentUser || { id: 'user_farmer_1', name: 'Sunil Kadam' };
    const conversationId = `conv_${equipmentId}_${current.id}_${ownerId}`;

    this.activeConversation = {
      conversationId,
      equipmentId,
      otherUserId: ownerId,
      otherUserName: ownerName,
      equipmentTitle: 'Machinery Inquiry'
    };
    this.activeEquipmentId = equipmentId;

    this.openChatModal(conversationId);
  },

  startChatWithFarmer(farmerId, farmerName, equipmentId) {
    const current = Auth.currentUser || { id: 'user_owner_1', name: 'Ramesh Patil' };
    const conversationId = `conv_${equipmentId}_${farmerId}_${current.id}`;

    this.activeConversation = {
      conversationId,
      equipmentId,
      otherUserId: farmerId,
      otherUserName: farmerName,
      equipmentTitle: 'Booking Discussion'
    };
    this.activeEquipmentId = equipmentId;

    this.openChatModal(conversationId);
  }
};
