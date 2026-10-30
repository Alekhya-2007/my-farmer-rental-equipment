# 🚜 AgriRent - Farmer Equipment Rental Platform

**AgriRent** is a peer-to-peer Agricultural Machinery & Custom Hiring sharing platform that enables **Farmers** to rent tractors, harvesters, tillers, and precision spray drones directly from local **Equipment Owners (Lessors)**.

---

## 🌟 Key Features

### 1. 🌾 Farmer (Renter) Experience
- **Interactive Machinery Catalog**:
  - Filter by category: **Tractors (35-75+ HP)**, **Combine Harvesters & Balers**, **Rotavators & Ploughs**, **Agri Sprayers & Drones**, **Irrigation Pumps**.
  - Search by brand (Mahindra, John Deere, Kubota, Sonalika, New Holland, DJI), model, or farm operations.
  - Power filter (HP range), maximum rental budget slider, and operator/driver filter.
- **Dynamic Cost Calculator**:
  - Choose between **Daily** and **Hourly** rental durations.
  - Transparent pricing breakdown: Base Rent + Operator Fee + Farm Delivery/Transport + Platform Assurance Fee.
  - 100% Refundable Security Deposit calculation.
- **Farmer Dashboard ("My Rentals")**:
  - Live status tracking (`Awaiting Owner Approval`, `Booking Confirmed`, `Active in Field`, `Completed & Returned`).
  - View & print certified **Lease Agreements**.
  - Digital **Handover Inspection Checklist** (meter hours, fuel tank status, safety condition).
  - Submit equipment ratings and field performance reviews.

---

### 2. 🚜 Equipment Owner (Lessor) Portal
- **Fleet Management**:
  - Add new machinery listings with multi-step specs (HP, brand, attachments, fuel policy, photos).
  - Toggle machine status between **Available** and **In Maintenance / Service**.
- **Rental Pipeline & Request Management**:
  - 1-click **Accept & Confirm** or **Decline** incoming farmer bookings.
  - Pipeline progression: Mark machinery **In-Field (Active)** when delivered, and **Complete & Release Deposit** when returned.
- **Earnings & Financial Overview**:
  - Comprehensive revenue breakdown: Net Equipment Rent, Skilled Operator Compensation, and Farm Transport Fees.
  - Payout ledger with complete booking histories.

---

### 3. 📄 Certified Digital Rental Agreements & Inspections
- **AgriRent Legal Lease Agreement**:
  - Automatically binds Lessor and Lessee with operational zone clauses, fuel policy, security deposit terms, and printable layout (`window.print()`).
- **Two-Phase Handover Inspection**:
  - **Phase 1 (Pre-rental)**: Log starting engine hour meter, fuel tank level (100%, 75%, 50%), check engine oil, tire tread, hydraulics, and digital sign-off.
  - **Phase 2 (Post-rental)**: Log return meter hours, check for wear and tear, and authorize security deposit refund.

---

### 4. 💬 Real-Time In-App Messaging
- Direct chat thread between Farmers and Owners tied directly to equipment inquiries and active bookings.
- Unread message counters and responsive conversation history.

---

## 🛠️ Technology Stack

- **Backend**: Node.js & Express RESTful API (`server.js`)
- **Database**: Persistent high-speed transactional JSON store (`database.js` / `data/db.json`), pre-seeded with realistic Indian agricultural machinery (`seedData.js`). Easily convertible to MySQL 8.0.
- **Frontend**: Responsive Single Page App (SPA) built with Tailwind CSS, Lucide-style UI icons, and modular JavaScript controllers:
  - `public/js/farmerView.js` - Marketplace, filters & pricing engine
  - `public/js/ownerView.js` - Fleet management, request approvals & payouts
  - `public/js/inspectionView.js` - Digital lease agreement & checklist
  - `public/js/chatView.js` - Real-time in-app chat
  - `public/js/auth.js` - Role switching & persona management
  - `public/js/api.js` - REST client

---

## 🚀 Quick Start Guide

### 1. Start the Server
```powershell
node server.js
```
The server will start listening at:
👉 **`http://localhost:3000`**

### 2. Switch Test Personas
Use the **"Active User"** dropdown in the top navbar to instantly test both sides of the marketplace:
- **🌾 Sunil Kadam (Farmer)** - 12 Acres in Pune (Sugarcane & Wheat)
- **🌾 Jaspreet Kaur (Farmer)** - 25 Acres in Ludhiana (Paddy & Mustard)
- **🚜 Ramesh Patil (Owner)** - Patil Agri Machinery Fleet (Mahindra Tractor, Rotavators)
- **🚜 Gurpreet Dhillon (Owner)** - Dhillon Harvester Fleet (Kubota DC-68G Harvester, Baler)
- **🚜 Vikram Patel (Owner)** - SmartDrone Solutions (DJI Agras T40 Sprayer, Laser Leveller)

---

## 📁 Directory Structure

```
Farmer_Equipment_Rental/
├── package.json          # Project metadata & dependencies
├── server.js             # Express API server & static file host
├── database.js           # Relational persistent database layer
├── seedData.js           # Demo equipment, users, bookings & reviews
├── data/
│   └── db.json           # Live persisted database file
├── public/
│   ├── index.html        # Main web application layout & modals
│   ├── css/
│   │   └── custom.css    # Custom animations, print styles & canvas
│   └── js/
│       ├── app.js        # Main orchestrator & router
│       ├── api.js        # Unified REST client
│       ├── auth.js       # Auth & demo persona switcher
│       ├── farmerView.js # Marketplace, filters & rental calculator
│       ├── ownerView.js  # Fleet manager, pipeline & earnings
│       ├── chatView.js   # In-app messaging modal
│       ├── inspectionView.js # Lease agreements & inspections
│       └── utils.js      # Currency (₹), dates & toast notifications
└── README.md
```
