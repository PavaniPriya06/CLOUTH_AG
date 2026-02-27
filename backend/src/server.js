const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const settingsRoutes = require('./routes/settings');

// Import passport config
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.CLIENT_URL
        ].filter(Boolean);
        
        // Allow any Vercel or Render domain
        if (origin.includes('vercel.app') || origin.includes('onrender.com') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        callback(null, true); // Allow all in development
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.JWT_SECRET || 'tcs_session_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Static files (product images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'TCS Backend Running!', time: new Date() });
});

// Connect to MongoDB
const connectDB = async () => {
    let uri = process.env.MONGODB_URI;
    let connected = false;

    // Try connecting to the configured URI first
    if (uri) {
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ MongoDB Connected to:', uri.includes('@') ? '[Atlas]' : uri);
            connected = true;
        } catch (connectErr) {
            console.log('⚠️ Could not connect to configured MongoDB at', uri);
            console.log('📝 Falling back to in-memory database...');
        }
    }

    // Fallback to MongoDB Memory Server if Atlas fails
    if (!connected) {
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log('✅ MongoDB Memory Server Connected');
            console.log('ℹ️ Using in-memory database. Data will be lost on restart.');
        } catch (memErr) {
            console.error('❌ Failed to start Memory Server:', memErr.message);
            return;
        }
    }

    // Seed admin user
    try {
        const User = require('./models/User');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@tcs.com';
        const existing = await User.findOne({ email: adminEmail });
        if (!existing) {
            await User.create({
                name: 'TCS Admin',
                email: adminEmail,
                password: process.env.ADMIN_PASSWORD || 'Admin@123',
                role: 'admin'
            });
            console.log(`✅ Admin seeded: ${adminEmail}`);
        } else {
            console.log(`✅ Admin exists: ${adminEmail}`);
        }
    } catch (seedErr) {
        console.log('⚠️ Could not seed admin:', seedErr.message);
    }
};

connectDB();

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    
    // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 TCS Server running on http://localhost:${PORT}`);
});
