const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET all products (public) with filters
router.get('/', async (req, res) => {
    try {
        const { category, gender, isNewArrival, isFeatured, search, sort, limit = 20, page = 1 } = req.query;
        const filter = { isActive: true };
        if (category) filter.category = category;
        if (gender) filter.gender = gender;
        if (isNewArrival === 'true') filter.isNewArrival = true;
        if (isFeatured === 'true') filter.isFeatured = true;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const sortOptions = sort === 'price_asc' ? { price: 1 }
            : sort === 'price_desc' ? { price: -1 }
                : { createdAt: -1 };

        const products = await Product.find(filter)
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Product.countDocuments(filter);
        res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create product (admin)
router.post('/', protect, adminOnly, upload.array('images', 8), async (req, res) => {
    try {
        const { name, price, originalPrice, qualityGrade, gender, description, category, sizes, colors, stock, isFeatured, isNewArrival, tags } = req.body;
        
        if (!name || !price || !gender || !description) {
            return res.status(400).json({ message: 'Name, price, gender, and description are required' });
        }

        const images = req.files ? req.files.map(f => `/uploads/products/${f.filename}`) : [];

        const product = await Product.create({
            name, price, originalPrice, qualityGrade, gender, description, category,
            sizes: sizes ? JSON.parse(sizes) : [],
            colors: colors ? JSON.parse(colors) : [],
            stock: stock || 10,
            images,
            isFeatured: isFeatured === 'true',
            isNewArrival: isNewArrival !== 'false',
            tags: tags ? JSON.parse(tags) : []
        });
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update product (admin)
router.put('/:id', protect, adminOnly, upload.array('images', 8), async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.files && req.files.length > 0) {
            updates.images = req.files.map(f => `/uploads/products/${f.filename}`);
        }
        ['sizes', 'colors', 'tags'].forEach(field => {
            if (updates[field]) updates[field] = JSON.parse(updates[field]);
        });
        const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE product (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
