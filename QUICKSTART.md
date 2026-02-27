# ⚡ QUICK START GUIDE - TCS E-Commerce Platform

## 🚀 Get Running in 5 Minutes

### Step 1: Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in new terminal)
cd frontend
npm install
```

### Step 2: Setup MongoDB

#### Option A: Local MongoDB
```bash
# On Mac (with Homebrew)
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services app or:
mongod

# On Linux
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Copy to backend/.env as `MONGODB_URI`

### Step 3: Environment Configuration

#### Backend (.env)
```bash
cd backend
cp .env.example .env

# Edit .env with:
MONGODB_URI=mongodb://localhost:27017/tcs_store
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@tcs.com
ADMIN_PASSWORD=Admin@123
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
cd frontend
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000
EOF
```

### Step 4: Start Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Output: 🚀 TCS Server running on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Output: VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Step 5: Access Application

| Role | URL | Email | Password |
|------|-----|-------|----------|
| User (Shop) | http://localhost:5173 | - | Sign up |
| Admin Panel | http://localhost:5173/admin/login | admin@tcs.com | Admin@123 |

---

## ✅ Verify Setup

### 1. Check Backend is Running
```bash
curl http://localhost:5000/api/health
# Response: {"status":"TCS Backend Running!","time":"..."}
```

### 2. Check MongoDB Connection
- Admin console should show "✅ MongoDB Connected"
- Admin user should be seeded automatically

### 3. Add a Test Product
1. Go to http://localhost:5173/admin/login
2. Login with demo credentials
3. Click "Products" tab
4. Click "Add Product"
5. Fill in form and upload images
6. Click "Add Product"
7. Go to homepage - product should appear!

### 4. Test Shopping
1. Go to http://localhost:5173
2. Click on a product
3. Click "Add to Cart"
4. Go to cart (/cart)
5. Follow checkout steps
6. Try COD first (no payment needed)

---

## 🎯 Main Features at a Glance

### For Admin
- ✅ Login: `/admin/login`
- ✅ Add products with images
- ✅ View & manage all orders
- ✅ Save UPI ID for payments
- ✅ Update order status

### For Users
- ✅ Browse by Gender (Men/Women/Kids/Unisex)
- ✅ View New Arrivals
- ✅ Filter & sort products
- ✅ Add to cart
- ✅ Checkout in 3 easy steps
- ✅ Track orders
- ✅ Download receipts (PDF)

---

## 💳 Payment Setup (Optional)

### To enable Razorpay payments:

1. **Create Razorpay Account**
   - Go to https://razorpay.com
   - Sign up for free account
   - Go to Settings → API Keys
   - Copy Key ID and Key Secret

2. **Update .env**
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

3. **Set Admin UPI ID**
   - Login to admin panel
   - Go to Settings tab
   - Enter your UPI ID (e.g., yourname@upi)
   - Click Save

4. **Test Payment**
   - Add products
   - Go through checkout
   - Select "Pay Online"
   - Razorpay modal opens
   - Use test card: 4111 1111 1111 1111

---

## 🆘 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
mongod

# If this is first time, create database:
mongo
> use tcs_store
> db.createCollection("users")
```

### "Port 5000 already in use"
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### "Cannot GET /api/products"
- Check backend is running on port 5000
- Check MONGODB_URI in .env is correct
- Look for errors in backend terminal

### Frontend not loading styles
```bash
# Rebuild Tailwind CSS
cd frontend
npm run dev
# Delete .vite cache if needed
rm -rf node_modules/.vite
```

### Images not showing after upload
- Check `backend/uploads/products/` folder exists
- Check folder has write permissions
- Restart backend server

---

## 📁 Project Structure

```
backend/
  src/
    models/ → Database schemas
    routes/ → API endpoints
    controllers/ → Business logic
    middleware/ → Auth, upload
    uploads/ → Image storage
  .env → Configuration

frontend/
  src/
    pages/ → All pages (admin, user)
    components/ → Reusable components
    context/ → Auth & Cart state
    utils/ → API helper
  tailwind.config.js → Design theme
```

---

## 🎨 Customization

### Change Colors
Edit `frontend/tailwind.config.js`:
```javascript
theme: {
  colors: {
    cream: { 50: '#FAF7F0', 100: '#F5F0E8', ... },
    charcoal: { DEFAULT: '#2C1810', muted: '#4A3728' },
    gold: { DEFAULT: '#D4A574', dark: '#C49563' }
  }
}
```

### Change Store Name
- Backend: Update in auth.js seeding
- Frontend: Update in Navbar.jsx & LandingPage.jsx

### Add More Product Fields
1. Update Product model: `backend/src/models/Product.js`
2. Update add product form: `frontend/src/pages/AdminDashboard.jsx`
3. Update product API route: `backend/src/routes/products.js`

---

## 📦 What's Included

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Complete |
| Admin Authentication | ✅ Complete |
| Product Management | ✅ Complete |
| Shopping Cart | ✅ Complete |
| Checkout (3-step) | ✅ Complete |
| Payment (COD) | ✅ Complete |
| Payment (UPI/Razorpay) | ✅ Complete |
| Order Tracking | ✅ Complete |
| PDF Receipts | ✅ Complete |
| Responsive Design | ✅ Complete |
| Professional UI | ✅ Complete |

---

## 🚀 Next: Production Setup

When ready to launch:

1. **Get a domain name** (namecheap.com, godaddy.com)
2. **Deploy backend** (Railway.app, Heroku, or AWS)
3. **Deploy frontend** (Vercel.com, Netlify)
4. **Set up SSL certificate** (Let's Encrypt - usually automatic)
5. **Use real payment credentials** (Not test keys)
6. **Configure email** (For order notifications)

---

## 📞 Need Help?

1. **Check Errors**: Look at browser console (F12)
2. **Check Terminal**: Read backend error messages
3. **Check Network**: Open DevTools → Network tab
4. **Check .env**: Verify all required variables are set
5. **Check GitHub Issues**: Search for similar problems
6. **Review IMPLEMENTATION_GUIDE.md**: Detailed docs

---

## ✨ You're All Set!

Your TCS E-Commerce platform is ready. Start adding products and process orders like Amazon! 🎉

**Happy selling!** 👗💰✨
