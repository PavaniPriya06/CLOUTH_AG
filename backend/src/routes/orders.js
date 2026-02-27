const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');
const { generateReceipt } = require('../controllers/pdfController');

// Create order (for COD / manual orders / Buy Now)
router.post('/', protect, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, notes, saveAddress } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

        // Validate shipping address is provided
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
            return res.status(400).json({ message: 'Complete shipping address is required' });
        }

        let totalAmount = 0;
        const enrichedItems = [];
        for (const item of items) {
            // Support both real product IDs and buy-now items with pre-filled price/name
            if (item.product && item.product.startsWith && item.product.startsWith('demo-')) {
                enrichedItems.push({ name: item.name, price: item.price, image: item.image, quantity: item.quantity || 1, size: item.size });
                totalAmount += item.price * (item.quantity || 1);
            } else if (item.product) {
                const product = await Product.findById(item.product);
                if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
                enrichedItems.push({ product: item.product, name: item.name || product.name, price: item.price || product.price, image: item.image || (product.images?.[0] || ''), quantity: item.quantity || 1, size: item.size });
                totalAmount += (item.price || product.price) * (item.quantity || 1);
            } else {
                enrichedItems.push({ name: item.name, price: item.price, image: item.image, quantity: item.quantity || 1, size: item.size });
                totalAmount += item.price * (item.quantity || 1);
            }
        }

        const shippingCharge = totalAmount > 999 ? 0 : 49;
        totalAmount += shippingCharge;

        // Normalise address — frontend may send fullName/houseNo or legacy name/street
        const addr = shippingAddress || {};
        const normalisedAddress = {
            fullName: addr.fullName || addr.name || '',
            phone: addr.phone || addr.mobile || '',
            houseNo: addr.houseNo || addr.addressLine1 || '',
            street: addr.street || addr.addressLine2 || '',
            landmark: addr.landmark || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || ''
        };

        // Get admin UPI ID for reference
        let adminUpiId = '';
        try {
            const upiSetting = await Settings.findOne({ key: 'upi' });
            adminUpiId = upiSetting?.value || '';
        } catch {}

        const order = await Order.create({
            user: req.user._id,
            items: enrichedItems,
            totalAmount,
            shippingCharge,
            shippingAddress: normalisedAddress,
            paymentMethod: paymentMethod || 'Pending',
            paymentStatus: 'Pending',
            upiId: adminUpiId,
            notes,
            status: 'Pending',
            statusHistory: [{ status: 'Pending', note: 'Order placed, awaiting payment' }]
        });

        // NOTE: Address is NOT saved to user profile here
        // It will only be saved after payment is confirmed (in payment.js verify routes)
        // This prevents storing addresses for failed/abandoned payments

        await order.populate('user', 'name email phone');
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── IMPORTANT: Fixed routes BEFORE parameterized routes ───
// Get user's own orders
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 });
        res.json({ orders, total: orders.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: get all orders (MUST come after /my)
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { status } : {};
        const orders = await Order.find(filter)
            .populate('user', 'name email phone')
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Order.countDocuments(filter);
        res.json({ orders, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PARAMETERIZED ROUTES BELOW ───

// Get single order by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name images');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status, note, paymentStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        order.statusHistory.push({ status, note: note || '' });
        await order.save();
        await order.populate('user', 'name email phone');
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User: confirm UPI payment (self-confirm after manual UPI payment)
router.put('/:id/confirm-payment', protect, async (req, res) => {
    try {
        const { upiTransactionId } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        // Ensure user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Only allow if still pending
        if (order.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Payment already confirmed' });
        }

        order.paymentStatus = 'Paid';
        order.paymentMethod = 'UPI';
        order.status = 'Confirmed';
        if (upiTransactionId) order.upiTransactionId = upiTransactionId;
        order.statusHistory.push({ 
            status: 'Confirmed', 
            note: 'Payment confirmed by user (UPI)' 
        });
        
        await order.save();
        await order.populate('user', 'name email phone');
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Download receipt (generate on-the-fly or stream from file)
router.get('/:id/receipt', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name images');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        await generateReceipt(order, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Download invoice (both user & admin can access)
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // User can only access their own invoice, admin can access all
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!order.invoicePath) {
            return res.status(404).json({ message: 'Invoice not available for this order' });
        }

        // Stream invoice from disk
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../' + order.invoicePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Invoice file not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=TCS-Invoice-${order.orderNumber}.pdf`);
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
