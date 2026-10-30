// database.js - Persistent high-speed JSON-based relational database store
const fs = require('fs');
const path = require('path');
const { seedUsers, seedEquipment, seedBookings, seedMessages, seedReviews } = require('./seedData');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = {
  users: [],
  equipment: [],
  bookings: [],
  messages: [],
  reviews: []
};

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      console.log(`Database loaded: ${db.equipment.length} equipment, ${db.bookings.length} bookings, ${db.users.length} users.`);
      return;
    } catch (e) {
      console.warn('Error reading existing db.json, reseeding default data...', e);
    }
  }

  // Seed default data
  db = {
    users: seedUsers,
    equipment: seedEquipment,
    bookings: seedBookings,
    messages: seedMessages,
    reviews: seedReviews
  };
  saveDb();
  console.log('Database initialized and seeded successfully.');
}

// User Helpers
function getAllUsers() {
  return db.users;
}

function getUserById(id) {
  return db.users.find(u => u.id === id);
}

function getUserByEmail(email) {
  return db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
}

function createUser(userData) {
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    joinedDate: new Date().toISOString().split('T')[0],
    verified: true,
    rating: 5.0,
    avatar: userData.role === 'owner' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    ...userData
  };
  db.users.push(newUser);
  saveDb();
  return newUser;
}

// Equipment Helpers
function getEquipment(filters = {}) {
  let results = [...db.equipment];

  if (filters.category && filters.category !== 'all') {
    results = results.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.brand.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.suitableFor.toLowerCase().includes(q)
    );
  }

  if (filters.maxRate) {
    results = results.filter(e => e.dailyRate <= Number(filters.maxRate));
  }

  if (filters.minHp) {
    results = results.filter(e => e.hp >= Number(filters.minHp));
  }

  if (filters.hasOperator === 'true') {
    results = results.filter(e => e.hasOperator);
  }

  if (filters.ownerId) {
    results = results.filter(e => e.ownerId === filters.ownerId);
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase();
    results = results.filter(e => e.location.toLowerCase().includes(loc));
  }

  return results;
}

function getEquipmentById(id) {
  return db.equipment.find(e => e.id === id);
}

function createEquipment(data) {
  const newEq = {
    id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    rating: 5.0,
    reviewCount: 0,
    availabilityStatus: "available",
    images: data.images && data.images.length ? data.images : [
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80"
    ],
    features: Array.isArray(data.features) ? data.features : (data.features || '').split('\n').filter(Boolean),
    ...data
  };
  db.equipment.unshift(newEq);
  saveDb();
  return newEq;
}

function updateEquipment(id, updates) {
  const index = db.equipment.findIndex(e => e.id === id);
  if (index === -1) return null;
  db.equipment[index] = { ...db.equipment[index], ...updates };
  saveDb();
  return db.equipment[index];
}

function deleteEquipment(id) {
  const index = db.equipment.findIndex(e => e.id === id);
  if (index === -1) return false;
  db.equipment.splice(index, 1);
  saveDb();
  return true;
}

// Booking Helpers
function getBookings(filters = {}) {
  let results = [...db.bookings];
  if (filters.farmerId) {
    results = results.filter(b => b.farmerId === filters.farmerId);
  }
  if (filters.ownerId) {
    results = results.filter(b => b.ownerId === filters.ownerId);
  }
  if (filters.status && filters.status !== 'all') {
    results = results.filter(b => b.status === filters.status);
  }
  // Sort latest first
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return results;
}

function getBookingById(id) {
  return db.bookings.find(b => b.id === id);
}

function createBooking(data) {
  const eq = getEquipmentById(data.equipmentId);
  if (!eq) throw new Error("Equipment not found");

  const bookingCode = `AGR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Calculate pricing breakdown
  const rentalType = data.rentalType || 'days';
  const duration = Number(data.duration || 1);
  const rateApplied = rentalType === 'days' ? eq.dailyRate : eq.hourlyRate;
  const baseRent = rateApplied * duration;
  
  const withOperator = Boolean(data.withOperator);
  const operatorRate = withOperator ? (eq.operatorRatePerDay || 400) : 0;
  const operatorTotal = withOperator ? operatorRate * duration : 0;

  const deliveryNeeded = Boolean(data.deliveryNeeded);
  const deliveryDistanceKm = deliveryNeeded ? Number(data.deliveryDistanceKm || 10) : 0;
  const deliveryFee = deliveryNeeded ? deliveryDistanceKm * (eq.deliveryChargePerKm || 25) : 0;

  const securityDeposit = Number(eq.securityDeposit || 2000);
  const subtotal = baseRent + operatorTotal + deliveryFee;
  const platformFee = Math.round(subtotal * 0.03) + 50; // 3% + 50 INR
  const totalAmount = subtotal + platformFee;

  const newBooking = {
    id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    bookingCode,
    equipmentId: eq.id,
    equipmentTitle: eq.title,
    equipmentImage: eq.images[0] || "",
    farmerId: data.farmerId,
    farmerName: data.farmerName,
    farmerPhone: data.farmerPhone,
    farmerLocation: data.farmerLocation || "",
    ownerId: eq.ownerId,
    ownerName: eq.ownerName,
    ownerPhone: eq.ownerPhone,
    rentalType,
    startDate: data.startDate,
    endDate: data.endDate,
    durationDays: rentalType === 'days' ? duration : 0,
    durationHours: rentalType === 'hours' ? duration : 0,
    rateApplied,
    baseRent,
    withOperator,
    operatorRate,
    operatorTotal,
    deliveryNeeded,
    deliveryDistanceKm,
    deliveryFee,
    securityDeposit,
    subtotal,
    platformFee,
    totalAmount,
    depositRefundable: securityDeposit,
    status: eq.instantBooking ? "confirmed" : "pending",
    paymentStatus: "paid",
    purpose: data.purpose || "Farming field operation",
    fieldAddress: data.fieldAddress || "Farmer Farm Location",
    createdAt: new Date().toISOString(),
    inspection: {
      preRentalDone: false,
      preRentalNotes: "",
      preRentalMeterHours: null,
      preRentalFuelLevel: "100%",
      preRentalSignedByOwner: false,
      preRentalSignedByFarmer: false,
      preRentalTimestamp: null,
      postRentalDone: false,
      postRentalNotes: "",
      postRentalMeterHours: null,
      postRentalFuelLevel: null,
      postRentalSignedByOwner: false,
      postRentalSignedByFarmer: false,
      postRentalTimestamp: null
    },
    agreementSigned: true,
    agreementPdfGenerated: true
  };

  db.bookings.unshift(newBooking);
  saveDb();
  return newBooking;
}

function updateBooking(id, updates) {
  const index = db.bookings.findIndex(b => b.id === id);
  if (index === -1) return null;

  // Deep merge inspection if provided
  if (updates.inspection) {
    updates.inspection = {
      ...db.bookings[index].inspection,
      ...updates.inspection
    };
  }

  db.bookings[index] = {
    ...db.bookings[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveDb();
  return db.bookings[index];
}

// Inspection Helpers
function recordInspection(bookingId, type, inspectionData) {
  const booking = getBookingById(bookingId);
  if (!booking) return null;

  if (type === 'pre') {
    booking.inspection.preRentalDone = true;
    booking.inspection.preRentalNotes = inspectionData.notes || "Inspected and verified.";
    booking.inspection.preRentalMeterHours = Number(inspectionData.meterHours || 0);
    booking.inspection.preRentalFuelLevel = inspectionData.fuelLevel || "100%";
    booking.inspection.preRentalSignedByOwner = Boolean(inspectionData.signedByOwner);
    booking.inspection.preRentalSignedByFarmer = Boolean(inspectionData.signedByFarmer);
    booking.inspection.preRentalTimestamp = new Date().toISOString();
    booking.status = "in_progress";
  } else if (type === 'post') {
    booking.inspection.postRentalDone = true;
    booking.inspection.postRentalNotes = inspectionData.notes || "Equipment returned and checked.";
    booking.inspection.postRentalMeterHours = Number(inspectionData.meterHours || 0);
    booking.inspection.postRentalFuelLevel = inspectionData.fuelLevel || "100%";
    booking.inspection.postRentalSignedByOwner = Boolean(inspectionData.signedByOwner);
    booking.inspection.postRentalSignedByFarmer = Boolean(inspectionData.signedByFarmer);
    booking.inspection.postRentalTimestamp = new Date().toISOString();
    booking.status = "completed";
  }

  saveDb();
  return booking;
}

// Messages & Chat Helpers
function getMessages(conversationId) {
  return db.messages.filter(m => m.conversationId === conversationId);
}

function getConversationsForUser(userId) {
  const userMessages = db.messages.filter(m => m.senderId === userId || m.receiverId === userId);
  const convMap = new Map();

  userMessages.forEach(m => {
    const existing = convMap.get(m.conversationId);
    if (!existing || new Date(m.timestamp) > new Date(existing.lastMessage.timestamp)) {
      const otherUserId = m.senderId === userId ? m.receiverId : m.senderId;
      const otherUserName = m.senderId === userId ? m.receiverName : m.senderName;
      const eq = getEquipmentById(m.equipmentId);

      convMap.set(m.conversationId, {
        conversationId: m.conversationId,
        equipmentId: m.equipmentId,
        equipmentTitle: eq ? eq.title : 'Equipment Inquiry',
        equipmentImage: eq && eq.images ? eq.images[0] : '',
        otherUserId,
        otherUserName,
        lastMessage: m,
        unreadCount: userMessages.filter(x => x.conversationId === m.conversationId && x.receiverId === userId && !x.read).length
      });
    }
  });

  return Array.from(convMap.values()).sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
}

function createMessage(data) {
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    conversationId: data.conversationId,
    equipmentId: data.equipmentId,
    senderId: data.senderId,
    senderName: data.senderName,
    receiverId: data.receiverId,
    receiverName: data.receiverName,
    text: data.text,
    timestamp: new Date().toISOString(),
    read: false
  };
  db.messages.push(msg);
  saveDb();
  return msg;
}

function markMessagesRead(conversationId, userId) {
  db.messages.forEach(m => {
    if (m.conversationId === conversationId && m.receiverId === userId) {
      m.read = true;
    }
  });
  saveDb();
  return true;
}

// Reviews
function getReviews(equipmentId) {
  return db.reviews.filter(r => r.equipmentId === equipmentId);
}

function createReview(data) {
  const rev = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    equipmentId: data.equipmentId,
    bookingId: data.bookingId,
    authorId: data.authorId,
    authorName: data.authorName,
    rating: Number(data.rating || 5),
    comment: data.comment,
    date: new Date().toISOString().split('T')[0]
  };
  db.reviews.unshift(rev);

  // Recalculate average rating for equipment
  const eq = getEquipmentById(data.equipmentId);
  if (eq) {
    const allEqReviews = getReviews(data.equipmentId);
    const avg = allEqReviews.reduce((sum, r) => sum + r.rating, 0) / allEqReviews.length;
    eq.rating = Math.round(avg * 100) / 100;
    eq.reviewCount = allEqReviews.length;
  }

  saveDb();
  return rev;
}

// Dashboard statistics
function getDashboardStats(userId, role) {
  if (role === 'owner') {
    const ownerEquipments = db.equipment.filter(e => e.ownerId === userId);
    const ownerBookings = db.bookings.filter(b => b.ownerId === userId);
    
    const totalEarnings = ownerBookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'in_progress')
      .reduce((sum, b) => sum + (b.subtotal || 0), 0);
    
    const pendingRequests = ownerBookings.filter(b => b.status === 'pending').length;
    const activeRentals = ownerBookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length;
    const completedRentals = ownerBookings.filter(b => b.status === 'completed').length;

    return {
      totalEquipment: ownerEquipments.length,
      totalEarnings,
      pendingRequests,
      activeRentals,
      completedRentals,
      recentBookings: ownerBookings.slice(0, 5)
    };
  } else {
    // Farmer stats
    const farmerBookings = db.bookings.filter(b => b.farmerId === userId);
    const totalSpent = farmerBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const activeBookings = farmerBookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length;
    const pendingBookings = farmerBookings.filter(b => b.status === 'pending').length;
    const completedBookings = farmerBookings.filter(b => b.status === 'completed').length;

    return {
      totalBookings: farmerBookings.length,
      totalSpent,
      activeBookings,
      pendingBookings,
      completedBookings,
      recentBookings: farmerBookings.slice(0, 5)
    };
  }
}

// Reset Database to Seed State
function resetToSeed() {
  db = {
    users: JSON.parse(JSON.stringify(seedUsers)),
    equipment: JSON.parse(JSON.stringify(seedEquipment)),
    bookings: JSON.parse(JSON.stringify(seedBookings)),
    messages: JSON.parse(JSON.stringify(seedMessages)),
    reviews: JSON.parse(JSON.stringify(seedReviews))
  };
  saveDb();
  return { message: "Database reset to initial demo seeds." };
}

// Auto init on import
initDb();

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  recordInspection,
  getMessages,
  getConversationsForUser,
  createMessage,
  markMessagesRead,
  getReviews,
  createReview,
  getDashboardStats,
  resetToSeed
};
