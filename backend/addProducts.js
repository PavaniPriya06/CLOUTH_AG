const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');

const sampleProducts = [
    {
        name: 'Maroon Co-ord Set',
        price: 2499,
        originalPrice: 3499,
        gender: 'Women',
        qualityGrade: 'Premium',
        category: 'Co-ord Sets',
        description: 'Elegant maroon cotton co-ord set perfect for casual and semi-formal occasions. Features comfortable fit and premium fabric.',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: 25,
        isFeatured: true,
        isNewArrival: true
    },
    {
        name: 'Navy Blue Top',
        price: 1299,
        originalPrice: 1599,
        gender: 'Women',
        qualityGrade: 'Export',
        category: 'Tops',
        description: 'Classic navy blue top made from premium cotton blend. Perfect for everyday wear.',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        stock: 30,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Black Straight Pants',
        price: 1499,
        originalPrice: 1999,
        gender: 'Women',
        qualityGrade: 'Regular',
        category: 'Bottoms',
        description: 'Comfortable black straight fit pants ideal for casual and formal wear.',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: 20,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Beige Linen Dress',
        price: 1899,
        originalPrice: 2499,
        gender: 'Women',
        qualityGrade: 'Premium',
        category: 'Dresses',
        description: 'Beautiful beige linen dress perfect for summer. Breathable and elegant design.',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: 15,
        isFeatured: true,
        isNewArrival: true
    },
    {
        name: 'White Cotton Shirt',
        price: 999,
        originalPrice: 1299,
        gender: 'Men',
        qualityGrade: 'Regular',
        category: 'Tops',
        description: 'Classic white cotton shirt for men. Perfect for formal and casual occasions.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stock: 35,
        isFeatured: false,
        isNewArrival: false
    },
    {
        name: 'Multicolor Co-ord Set',
        price: 2799,
        originalPrice: 3999,
        gender: 'Women',
        qualityGrade: 'Premium',
        category: 'Co-ord Sets',
        description: 'Vibrant multicolor co-ord set with traditional patterns. Premium quality fabric.',
        sizes: ['XS', 'S', 'M', 'L'],
        stock: 18,
        isFeatured: true,
        isNewArrival: true
    }
];

async function addProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tcs_store');
        console.log('✅ Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Add sample products
        const result = await Product.insertMany(sampleProducts);
        console.log(`✅ Added ${result.length} sample products!`);

        result.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name} - ₹${product.price}`);
        });

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

addProducts();
