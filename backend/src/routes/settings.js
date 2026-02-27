const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, adminOnly: admin } = require('../middleware/auth');

// Get setting by key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) return res.status(404).json({ message: 'Setting not found' });
        res.json(setting);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all settings (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const settings = await Settings.find();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update or create setting (Admin only)
router.post('/', protect, admin, async (req, res) => {
    const { key, value } = req.body;
    try {
        if (!key) return res.status(400).json({ message: 'Key is required' });
        
        let setting = await Settings.findOne({ key });
        if (setting) {
            setting.value = value;
            await setting.save();
        } else {
            setting = await Settings.create({ key, value });
        }
        res.json(setting);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update specific setting (Admin only)
router.put('/:key', protect, admin, async (req, res) => {
    const { value } = req.body;
    try {
        let setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            setting = await Settings.create({ key: req.params.key, value });
        } else {
            setting.value = value;
            await setting.save();
        }
        res.json(setting);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
