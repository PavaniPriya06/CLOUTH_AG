const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { generateAndSaveInvoice } = require('../controllers/pdfController');
const { sendOrderNotificationSMS } = require('../services/smsService');

const getRazorpay = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder'
});

// Helper: Save address to user profile ONLY after successful payment
const saveAddressToUserOnPaymentSuccess = async (userId, shippingAddress) => {
    if (!userId || !shippingAddress || !shippingAddress.pincode) return;
    
    try {
        const user = await User.findById(userId);
        if (!user) return;
        
        const existingAddr = user.addresses?.find(a => 
            a.pincode === shippingAddress.pincode && 
            a.houseNo === shippingAddress.houseNo
        );
        
        if (!existingAddr) {
            user.addresses = user.addresses || [];
            user.addresses.push({
                label: 'Home',
                fullName: shippingAddress.fullName || shippingAddress.name || '',
                phone: shippingAddress.phone || '',
                houseNo: shippingAddress.houseNo || '',
                street: shippingAddress.street || '',
                landmark: shippingAddress.landmark || '',
                city: shippingAddress.city || '',
                state: shippingAddress.state || '',
                pincode: shippingAddress.pincode || '',
                isDefault: user.addresses.length === 0
            });
            await user.save();
            console.log(`✅ Address saved to user profile after payment success`);
        }
    } catch (err) {
        console.error('Could not save address to user:', err.message);
    }
};

// Helper: Check if payment already processed (idempotency)
const isPaymentAlreadyProcessed = async (paymentId) => {
    if (!paymentId) return false;
    const existingOrder = await Order.findOne({ paymentId, paymentStatus: 'Paid' });
    return !!existingOrder;
};

// Get admin's UPI ID
const getAdminUpiId = async () => {
    try {
        const setting = await Settings.findOne({ key: 'upi' });
        return setting?.value || process.env.ADMIN_UPI_ID || 'store@upi';
    } catch {
        return process.env.ADMIN_UPI_ID || 'store@upi';
    }
};

// ─── AUTO-CREATE ORDER FROM CART ───────────────────────────────────────
// Helper function to create order automatically from cart + payment details
const createOrderFromCart = async (userId, paymentDetails) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items.length) {
        throw new Error('Cart is empty');
    }

    let totalAmount = 0;
    const enrichedItems = [];

    for (const item of cart.items) {
        if (item.product && item.product.startsWith && item.product.startsWith('demo-')) {
            enrichedItems.push({
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1,
                size: item.size,
                color: item.color
            });
            totalAmount += item.price * (item.quantity || 1);
        } else if (item.product) {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }
            enrichedItems.push({
                product: item.product,
                name: item.name || product.name,
                price: item.price || product.price,
                image: item.image || (product.images?.[0] || ''),
                quantity: item.quantity || 1,
                size: item.size,
                color: item.color
            });
            totalAmount += (item.price || product.price) * (item.quantity || 1);
        } else {
            enrichedItems.push({
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1,
                size: item.size,
                color: item.color
            });
            totalAmount += item.price * (item.quantity || 1);
        }
    }

    const shippingCharge = totalAmount > 999 ? 0 : 49;
    totalAmount += shippingCharge;

    // Create order with payment details
    const adminUpiId = await getAdminUpiId();
    const order = new Order({
        user: userId,
        items: enrichedItems,
        totalAmount,
        shippingCharge,
        shippingAddress: paymentDetails.shippingAddress,
        paymentMethod: paymentDetails.paymentMethod || 'Razorpay',
        paymentStatus: 'Paid', // Set to Paid immediately after webhook confirms
        paymentId: paymentDetails.paymentId,
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpaySignature: paymentDetails.razorpaySignature,
        upiId: adminUpiId,  // Store which UPI ID received the payment
        status: 'Confirmed', // Order is CONFIRMED once payment is verified
        statusHistory: [
            { status: 'Confirmed', note: 'Order auto-created after payment confirmation' }
        ]
    });

    // Save order first
    await order.save();

    // Populate and add invoice
    await order.populate('user', 'name email phone');

    // Generate PDF invoice automatically
    const invoiceData = await generateAndSaveInvoice(order);
    order.invoicePath = invoiceData.invoicePath;
    order.invoiceUrl = invoiceData.invoiceUrl;
    await order.save();

    // ──────────────────────────────────────────────────
    // SEND SMS NOTIFICATIONS (After order + invoice ready)
    // Only after: Razorpay confirms payment + Order created + Invoice generated
    // ──────────────────────────────────────────────────
    try {
        await sendOrderNotificationSMS(order);
    } catch (smsErr) {
        // Log error but DON'T fail the order
        // Order is already created and valid
        console.error('SMS notification error (order still valid):', smsErr.message);
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    return order;
};

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
    try {
        const { amount, orderId, shippingAddress } = req.body; // amount in rupees

        // Validate that user has items in cart
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: `receipt_${orderId || Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                userEmail: req.user.email || '',
                userName: req.user.name || '',
                shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : ''
            }
        };

        const razorpayOrder = await getRazorpay().orders.create(options);
        res.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify payment signature (called from frontend after Razorpay checkout)
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

        // ── IDEMPOTENCY CHECK: Prevent duplicate order creation ──
        if (await isPaymentAlreadyProcessed(razorpay_payment_id)) {
            // Payment already processed - return existing order
            const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
            return res.json({
                success: true,
                message: 'Payment already processed',
                orderId: existingOrder._id.toString(),
                orderNumber: existingOrder.orderNumber
            });
        }

        // Verify signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder');
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const expectedSignature = hmac.digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Auto-create order from cart + payment details
        const order = await createOrderFromCart(req.user._id, {
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpaySignature: razorpay_signature,
            paymentMethod: 'Razorpay',
            shippingAddress
        });

        // ── SAVE ADDRESS TO USER ONLY AFTER PAYMENT SUCCESS ──
        await saveAddressToUserOnPaymentSuccess(req.user._id, shippingAddress);

        res.json({
            success: true,
            message: 'Payment verified & order created',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Razorpay Webhook — server-side payment confirmation
// NOTE: Requires raw body — handled via server.js special middleware for this path
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'placeholder';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(req.body));
        const expectedSignature = hmac.digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body.event;
        const payment = req.body.payload?.payment?.entity;

        if (event === 'payment.captured' && payment) {
            const paymentId = payment.id;
            const userId = payment.notes?.userId;
            const orderId = payment.notes?.orderId;
            const shippingAddressStr = payment.notes?.shippingAddress;

            // ── IDEMPOTENCY CHECK: Use paymentId as unique reference ──
            if (await isPaymentAlreadyProcessed(paymentId)) {
                console.log(`⏭️ Payment ${paymentId} already processed - skipping webhook`);
                return res.json({ received: true, status: 'already_processed' });
            }

            // Parse shipping address from notes
            let shippingAddress = {};
            if (shippingAddressStr) {
                try {
                    shippingAddress = JSON.parse(shippingAddressStr);
                } catch (e) {
                    console.error('Could not parse shipping address:', e);
                }
            }

            // Case 1: Order already exists (Buy Now flow) - just update it
            if (orderId) {
                try {
                    const order = await Order.findById(orderId);
                    if (order && order.paymentStatus !== 'Paid') {
                        order.paymentStatus = 'Paid';
                        order.paymentId = paymentId;
                        order.paymentMethod = 'UPI';
                        order.status = 'Placed';
                        order.statusHistory.push({ 
                            status: 'Placed', 
                            note: 'Payment confirmed via webhook' 
                        });
                        await order.save();
                        
                        // Save address to user profile after payment success
                        if (userId) {
                            await saveAddressToUserOnPaymentSuccess(userId, order.shippingAddress);
                        }
                        
                        console.log(`✅ Order ${orderId} updated via webhook for payment ${paymentId}`);
                    }
                } catch (orderErr) {
                    console.error('Failed to update order from webhook:', orderErr);
                }
            }
            // Case 2: Cart checkout - create new order
            else if (userId) {
                try {
                    const order = await createOrderFromCart(userId, {
                        paymentId: paymentId,
                        razorpayOrderId: payment.order_id,
                        paymentMethod: 'Razorpay',
                        shippingAddress
                    });
                    
                    // Save address to user profile after payment success
                    await saveAddressToUserOnPaymentSuccess(userId, shippingAddress);
                    
                    console.log(`✅ Order auto-created for payment ${paymentId}`);
                } catch (orderErr) {
                    // Check if error is due to duplicate paymentId (unique constraint)
                    if (orderErr.code === 11000 && orderErr.keyPattern?.paymentId) {
                        console.log(`⏭️ Payment ${paymentId} already has an order - duplicate webhook ignored`);
                    } else {
                        console.error('Failed to create order from webhook:', orderErr);
                    }
                }
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get Razorpay public key (used by frontend)
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

// Get admin UPI ID for payment page
router.get('/upi-id', async (req, res) => {
    try {
        const upiId = await getAdminUpiId();
        res.json({ upiId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Razorpay order for UPI payment (for direct order, not cart)
router.post('/create-upi-order', protect, async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        // Validate the order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const upiId = await getAdminUpiId();
        
        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: `order_${orderId}`,
            payment_capture: 1,
            notes: {
                userId: req.user._id.toString(),
                orderId: orderId,
                adminUpiId: upiId
            }
        };

        const razorpayOrder = await getRazorpay().orders.create(options);
        
        // Update order with razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        order.upiId = upiId;
        await order.save();

        res.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            upiId: upiId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify UPI payment for existing order (Buy Now flow)
router.post('/verify-upi', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // ── IDEMPOTENCY CHECK: Prevent duplicate payment updates ──
        if (await isPaymentAlreadyProcessed(razorpay_payment_id)) {
            const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
            return res.json({
                success: true,
                message: 'Payment already verified',
                orderId: existingOrder._id.toString(),
                orderNumber: existingOrder.orderNumber
            });
        }

        // Verify signature
        const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const expectedSignature = hmac.digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Update order status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if this order is already paid (another idempotency check)
        if (order.paymentStatus === 'Paid') {
            return res.json({
                success: true,
                message: 'Order already paid',
                orderId: order._id.toString(),
                orderNumber: order.orderNumber
            });
        }

        order.paymentStatus = 'Paid';
        order.paymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.paymentMethod = 'UPI';
        order.status = 'Placed';
        order.statusHistory.push({ 
            status: 'Placed', 
            note: 'Payment verified via Razorpay UPI' 
        });
        
        await order.save();

        // ── SAVE ADDRESS TO USER ONLY AFTER PAYMENT SUCCESS ──
        await saveAddressToUserOnPaymentSuccess(req.user._id, order.shippingAddress);

        // Populate and generate invoice
        await order.populate('user', 'name email phone');

        // Generate PDF invoice
        try {
            const invoiceData = await generateAndSaveInvoice(order);
            order.invoicePath = invoiceData.invoicePath;
            order.invoiceUrl = invoiceData.invoiceUrl;
            await order.save();
        } catch (invoiceErr) {
            console.error('Invoice generation error:', invoiceErr);
        }

        // Send SMS notifications
        try {
            await sendOrderNotificationSMS(order);
        } catch (smsErr) {
            console.error('SMS notification error:', smsErr.message);
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
