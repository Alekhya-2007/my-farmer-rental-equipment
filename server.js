// server.js - Express API and Web Application Server for AgriRent
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup upload directory
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});
const upload = multer({ storage });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.get('/api/auth/users', (req, res) => {
  const users = db.getAllUsers().map(({ password, ...safeUser }) => safeUser);
  res.json({ success: true, users });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found with this email' });
  }

  if (password && user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, phone, location, businessName, farmSize } = req.body;
  
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'User with this email already exists' });
  }

  const newUser = db.createUser({
    name,
    email,
    password: password || 'password123',
    role, // 'farmer' or 'owner'
    phone: phone || '',
    location: location || '',
    businessName: businessName || '',
    farmSize: farmSize || ''
  });

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

// -------------------------------------------------------------
// EQUIPMENT ROUTES
// -------------------------------------------------------------
app.get('/api/equipment', (req, res) => {
  const filters = {
    category: req.query.category,
    search: req.query.search,
    maxRate: req.query.maxRate,
    minHp: req.query.minHp,
    hasOperator: req.query.hasOperator,
    location: req.query.location,
    ownerId: req.query.ownerId
  };

  const list = db.getEquipment(filters);
  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/equipment/:id', (req, res) => {
  const item = db.getEquipmentById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }
  const reviews = db.getReviews(req.params.id);
  res.json({ success: true, data: item, reviews });
});

app.post('/api/equipment', (req, res) => {
  try {
    const {
      title, category, brand, model, hp, dailyRate, hourlyRate, securityDeposit,
      hasOperator, operatorMandatory, operatorRatePerDay, fuelPolicy, location,
      images, features, suitableFor, condition, instantBooking, deliveryAvailable,
      deliveryChargePerKm, description, ownerId, ownerName, ownerPhone
    } = req.body;

    if (!title || !category || !dailyRate || !ownerId) {
      return res.status(400).json({ success: false, message: 'Title, category, daily rate, and owner are required' });
    }

    const created = db.createEquipment({
      title,
      category,
      brand: brand || 'Other',
      model: model || '',
      hp: Number(hp || 0),
      dailyRate: Number(dailyRate),
      hourlyRate: Number(hourlyRate || Math.round(dailyRate / 6)),
      securityDeposit: Number(securityDeposit || 2000),
      hasOperator: Boolean(hasOperator),
      operatorMandatory: Boolean(operatorMandatory),
      operatorRatePerDay: Number(operatorRatePerDay || 400),
      fuelPolicy: fuelPolicy || 'Full tank provided; return full',
      location: location || 'Pune, Maharashtra',
      images: images && images.length ? images : [
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80"
      ],
      features: features || [],
      suitableFor: suitableFor || 'General Farm Operations',
      condition: condition || 'Good Working Condition',
      instantBooking: Boolean(instantBooking),
      deliveryAvailable: Boolean(deliveryAvailable),
      deliveryChargePerKm: Number(deliveryChargePerKm || 25),
      description: description || '',
      ownerId,
      ownerName: ownerName || 'Owner',
      ownerPhone: ownerPhone || '+91 98000 00000',
      ownerRating: 5.0
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/equipment/:id', (req, res) => {
  const updated = db.updateEquipment(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }
  res.json({ success: true, data: updated });
});

app.delete('/api/equipment/:id', (req, res) => {
  const success = db.deleteEquipment(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }
  res.json({ success: true, message: 'Equipment deleted' });
});

// Image upload for equipment
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// -------------------------------------------------------------
// BOOKING ROUTES
// -------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  const filters = {
    farmerId: req.query.farmerId,
    ownerId: req.query.ownerId,
    status: req.query.status
  };
  const list = db.getBookings(filters);
  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.json({ success: true, data: booking });
});

app.post('/api/bookings', (req, res) => {
  try {
    const booking = db.createBooking(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = db.updateBooking(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.json({ success: true, data: updated });
});

// -------------------------------------------------------------
// INSPECTION & RENTAL AGREEMENT ROUTES
// -------------------------------------------------------------
app.post('/api/bookings/:id/inspection', (req, res) => {
  const { type, notes, meterHours, fuelLevel, signedByOwner, signedByFarmer } = req.body;
  if (type !== 'pre' && type !== 'post') {
    return res.status(400).json({ success: false, message: 'Inspection type must be "pre" or "post"' });
  }

  const updatedBooking = db.recordInspection(req.params.id, type, {
    notes,
    meterHours,
    fuelLevel,
    signedByOwner,
    signedByFarmer
  });

  if (!updatedBooking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({ success: true, data: updatedBooking });
});

// Generate printable HTML rental agreement data
app.get('/api/bookings/:id/agreement', (req, res) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const eq = db.getEquipmentById(booking.equipmentId);
  res.json({
    success: true,
    data: {
      contractId: `AGRI-AGR-${booking.bookingCode}`,
      date: new Date(booking.createdAt).toLocaleDateString(),
      booking,
      equipment: eq,
      terms: [
        "1. The Lessor (Equipment Owner) agrees to rent the machinery described above in good working condition.",
        "2. The Lessee (Farmer) agrees to use the equipment only for standard agricultural operations on the designated land.",
        "3. Fuel policy: Return with equivalent fuel level as recorded during pre-rental inspection.",
        "4. Any operational breakdown caused by negligence shall be evaluated and deductible from the refundable security deposit.",
        "5. The Lessee will not sublease or transport the machinery outside the designated operational zone without written consent.",
        "6. In the event of weather distress, both parties agree to reschedule within 14 calendar days."
      ]
    }
  });
});

// -------------------------------------------------------------
// CHAT & IN-APP MESSAGES ROUTES
// -------------------------------------------------------------
app.get('/api/conversations', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId query parameter is required' });
  }
  const conversations = db.getConversationsForUser(userId);
  res.json({ success: true, data: conversations });
});

app.get('/api/messages', (req, res) => {
  const conversationId = req.query.conversationId;
  if (!conversationId) {
    return res.status(400).json({ success: false, message: 'conversationId is required' });
  }
  const messages = db.getMessages(conversationId);
  res.json({ success: true, data: messages });
});

app.post('/api/messages', (req, res) => {
  const { conversationId, equipmentId, senderId, senderName, receiverId, receiverName, text } = req.body;
  if (!conversationId || !senderId || !receiverId || !text) {
    return res.status(400).json({ success: false, message: 'Missing message parameters' });
  }

  const msg = db.createMessage({
    conversationId,
    equipmentId,
    senderId,
    senderName,
    receiverId,
    receiverName,
    text
  });

  res.status(201).json({ success: true, data: msg });
});

app.post('/api/messages/read', (req, res) => {
  const { conversationId, userId } = req.body;
  if (!conversationId || !userId) {
    return res.status(400).json({ success: false, message: 'conversationId and userId required' });
  }
  db.markMessagesRead(conversationId, userId);
  res.json({ success: true, message: 'Messages marked as read' });
});

// -------------------------------------------------------------
// REVIEWS ROUTES
// -------------------------------------------------------------
app.get('/api/reviews', (req, res) => {
  const equipmentId = req.query.equipmentId;
  if (!equipmentId) {
    return res.status(400).json({ success: false, message: 'equipmentId required' });
  }
  const reviews = db.getReviews(equipmentId);
  res.json({ success: true, data: reviews });
});

app.post('/api/reviews', (req, res) => {
  const { equipmentId, bookingId, authorId, authorName, rating, comment } = req.body;
  if (!equipmentId || !authorId || !comment) {
    return res.status(400).json({ success: false, message: 'equipmentId, authorId, comment required' });
  }

  const rev = db.createReview({
    equipmentId,
    bookingId,
    authorId,
    authorName,
    rating,
    comment
  });

  res.status(201).json({ success: true, data: rev });
});

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
  const { userId, role } = req.query;
  if (!userId || !role) {
    return res.status(400).json({ success: false, message: 'userId and role query parameters required' });
  }
  const stats = db.getDashboardStats(userId, role);
  res.json({ success: true, data: stats });
});

// -------------------------------------------------------------
// DEMO RESET ROUTE
// -------------------------------------------------------------
app.post('/api/db/reset', (req, res) => {
  const result = db.resetToSeed();
  res.json({ success: true, message: result.message });
});

// Catch-all route to serve SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚜 AgriRent Server is running at http://localhost:${PORT}`);
  console.log(`🌾 Dual Portals: Farmers Rent & Equipment Owners List`);
  console.log(`=======================================================`);
});
