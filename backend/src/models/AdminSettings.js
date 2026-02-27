const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upiId: { type: String, required: true }, // Example: tcs@upi
    storeName: { type: String, default: 'TCS Store' },
    storeDescription: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    businessAddress: { type: String },
    returnPolicy: { type: String },
    shippingPolicy: { type: String },
    faqList: [{
        question: String,
        answer: String
    }],
    socialLinks: {
        instagram: String,
        facebook: String,
        twitter: String
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
