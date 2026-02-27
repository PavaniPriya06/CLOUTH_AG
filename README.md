# TCS – The Co-ord Set Studio 👗

A full-stack e-commerce platform for a local clothing service, built with React.js, Node.js, Tailwind CSS, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm

### 1. Configure Environment Variables

Copy the backend env template:
```bash
cd backend
copy .env.example .env
```
Edit `.env` with your MongoDB URI, JWT secret, and API keys.

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start Development Servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**

**Admin Login:** `admin@tcs.com` / `Admin@123`

---

## 📁 Project Structure

```
CLOTH_AG/
├── backend/
│   ├── src/
│   │   ├── config/passport.js      # Facebook OAuth
│   │   ├── controllers/pdfController.js  # PDF receipts
│   │   ├── middleware/auth.js      # JWT guard
│   │   ├── middleware/upload.js    # Multer image upload
│   │   ├── models/                 # User, Product, Order
│   │   ├── routes/                 # auth, products, orders, payment
│   │   └── server.js
│   ├── uploads/products/           # Uploaded product images
│   └── .env.example
└── frontend/
    └── src/
        ├── components/             # Navbar, Footer, ProductCard
        ├── context/                # AuthContext, CartContext
        ├── pages/                  # Landing, Product, Cart, Auth, Orders, Admin
        └── utils/api.js            # Axios instance
```

## ✨ Features

| Feature | Status |
|---|---|
| Admin Dashboard (Add/Edit/Delete Products) | ✅ |
| Multi-image upload | ✅ |
| User Registration (Email/Phone) | ✅ |
| Facebook Social Login | ✅ (needs App ID) |
| Instagram-style landing page | ✅ |
| New Arrivals with oval/arch frames | ✅ |
| Shopping Cart | ✅ |
| 3-step Checkout | ✅ |
| Cash on Delivery | ✅ |
| Razorpay Payment | ✅ (needs API keys) |
| PDF Receipt download | ✅ |
| Order status tracker | ✅ |
| Admin order management | ✅ |

## 🔑 API Keys Needed

- **MongoDB** — [mongodb.com/atlas](https://mongodb.com/atlas)
- **Razorpay** — [razorpay.com](https://razorpay.com)
- **Facebook OAuth** — [developers.facebook.com](https://developers.facebook.com)
- **Google Maps** — [console.cloud.google.com](https://console.cloud.google.com)
