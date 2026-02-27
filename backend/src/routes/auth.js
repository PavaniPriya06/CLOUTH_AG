const router = require('express').Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const { protect, adminOnly } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'tcs_jwt_secret', { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || (!email && !phone) || !password) {
            return res.status(400).json({ message: 'Name, email/phone and password are required' });
        }
        const existing = await User.findOne({ $or: [{ email }, { phone }] });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, phone, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
        });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || user.role !== 'admin' || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const adminSettings = await AdminSettings.findOne({ admin: user._id });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            adminSettings: adminSettings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user
router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

// Get Admin Settings
router.get('/admin/settings', protect, adminOnly, async (req, res) => {
    try {
        const settings = await AdminSettings.findOne({ admin: req.user._id });
        if (!settings) {
            return res.status(404).json({ message: 'Admin settings not found' });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Admin UPI ID
router.put('/admin/settings', protect, adminOnly, async (req, res) => {
    try {
        const { upiId, storeName, contactEmail, contactPhone, businessAddress } = req.body;
        if (!upiId) {
            return res.status(400).json({ message: 'UPI ID is required' });
        }

        let adminSettings = await AdminSettings.findOne({ admin: req.user._id });
        
        if (!adminSettings) {
            adminSettings = await AdminSettings.create({
                admin: req.user._id,
                upiId,
                storeName,
                contactEmail,
                contactPhone,
                businessAddress
            });
        } else {
            adminSettings.upiId = upiId;
            if (storeName) adminSettings.storeName = storeName;
            if (contactEmail) adminSettings.contactEmail = contactEmail;
            if (contactPhone) adminSettings.contactPhone = contactPhone;
            if (businessAddress) adminSettings.businessAddress = businessAddress;
            await adminSettings.save();
        }

        res.json(adminSettings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook' }),
    (req, res) => {
        const token = generateToken(req.user._id);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    }
);

// Update profile / add address
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/address', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (req.body.isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }
        user.addresses.push(req.body);
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed admin user (for manual setup)
router.post('/seed-admin', async (req, res) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@tcs.com';
        const existing = await User.findOne({ email: adminEmail });
        
        if (existing) {
            return res.json({ success: true, message: 'Admin user already exists', user: { email: existing.email, role: existing.role } });
        }

        const admin = await User.create({
            name: 'TCS Admin',
            email: adminEmail,
            password: process.env.ADMIN_PASSWORD || 'Admin@123',
            role: 'admin'
        });

        res.status(201).json({ 
            success: true, 
            message: 'Admin user created successfully',
            user: { email: admin.email, role: admin.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
