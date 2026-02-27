const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        image: String,
        quantity: { type: Number, default: 1 },
        size: String,
        color: String
    }],
    totalAmount: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Pending', 'Placed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentMethod: { type: String, enum: ['COD', 'Razorpay', 'UPI', 'Pending'], default: 'Pending' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    paymentId: { type: String, sparse: true, unique: true },  // Unique to prevent duplicate payments
    razorpayOrderId: { type: String },
    razorpaySignature: { type: String },  // Store signature for verification
    upiId: { type: String },  // Admin's UPI ID to which payment was sent
    upiTransactionId: { type: String },  // UPI transaction reference from user
    paymentReceipt: { type: String },  // Payment receipt/screenshot from user for UPI
    shippingAddress: {
        fullName: String,
        phone: String,
        houseNo: String,
        street: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        lat: Number,
        lng: Number
    },
    invoicePath: { type: String },  // Path to generated PDF invoice
    invoiceUrl: { type: String },  // URL to access invoice
    pdfPath: { type: String },  // Legacy - kept for compatibility
    notes: { type: String },
    // SMS Notifications
    smsSent: { type: Boolean, default: false },  // Track if SMS was sent to user
    smsAdminSent: { type: Boolean, default: false },  // Track if SMS was sent to admin
    smsError: { type: String },  // Store error message if SMS fails
    lastSmsSendAttempt: { type: Date },  // Track last SMS send attempt for retry
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }]
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `TCS${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
