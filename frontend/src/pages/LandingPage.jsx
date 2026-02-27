import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronDown, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

const GENDERS = ['Men', 'Women', 'Kids'];
const CATEGORIES = ['All', 'Co-ord Sets', 'Tops', 'Bottoms', 'Dresses', 'New Arrivals', 'Sale'];

// Placeholder demo products
const DEMO_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
    _id: `demo-${i}`,
    name: ['Floral Co-ord Set', 'Block Print Kurta', 'Boho Palazzo Set', 'Wavy Crop Top', 'Linen Coord Set', 'Summer Maxi', 'Tie-Dye Set', 'Paisley Duet'][i],
    price: [1299, 899, 1599, 699, 1899, 1399, 1099, 1799][i],
    originalPrice: [1699, null, 1999, null, 2399, 1699, null, 2199][i],
    qualityGrade: ['Premium', 'Export', 'Premium', 'Regular', 'Premium', 'Export', 'Regular', 'Premium'][i],
    gender: ['Women', 'Women', 'Women', 'Women', 'Men', 'Women', 'Kids', 'Men'][i],
    images: [],
    isNewArrival: i < 4,
    ratings: { average: 4.5, count: Math.floor(Math.random() * 100) + 5 },
    category: 'Co-ord Sets'
}));

export default function LandingPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGender, setActiveGender] = useState('Women');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sort, setSort] = useState('newest');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const initGender = searchParams.get('gender') || 'Women';
        const initCategory = searchParams.get('category') || 'All';
        setActiveGender(initGender);
        setActiveCategory(initCategory);
        fetchProducts(initGender, initCategory);
    }, [searchParams]);

    const fetchProducts = async (gender = activeGender, cat = activeCategory, sortBy = sort) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (gender) params.set('gender', gender);
            if (cat && cat !== 'All') {
                if (cat === 'New Arrivals') params.set('isNewArrival', 'true');
                else params.set('category', cat);
            }
            if (sortBy === 'price_asc') params.set('sort', 'price_asc');
            if (sortBy === 'price_desc') params.set('sort', 'price_desc');
            params.set('limit', '50');
            const { data } = await api.get(`/products?${params}`);

            // Use API products directly (API already filters by gender).
            // Only fall back to demo products if the DB is empty.
            const apiProducts = data.products || [];
            if (apiProducts.length > 0) {
                setProducts(apiProducts);
            } else {
                setProducts(DEMO_PRODUCTS.filter(p => p.gender === gender));
            }
        } catch {
            setProducts(DEMO_PRODUCTS.filter(p => p.gender === gender));
        } finally {
            setLoading(false);
        }
    };

    const handleGender = (gender) => {
        setActiveGender(gender);
        fetchProducts(gender, activeCategory, sort);
    };

    const handleCategory = (cat) => {
        setActiveCategory(cat);
        fetchProducts(activeGender, cat, sort);
    };

    return (
        <div className="pt-0 bg-cream-100 min-h-screen">
            {/* ── HERO ─────────────────────────────────────── */}
            <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-cream-gradient">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                            <p className="font-sans text-gold text-sm font-medium tracking-widest uppercase mb-4">✦ Artisan Crafted</p>
                            <h1 className="section-title text-5xl md:text-7xl mb-6">
                                The <em className="text-gold not-italic">Co-ord</em> Set <br />Studio
                            </h1>
                            <p className="section-subtitle mb-8 max-w-md">
                                Discover premium clothing crafted with love for the modern soul. Experience the perfect blend of comfort and style.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#shop" className="btn-primary">Shop Now</a>
                                <a href="#shop" className="btn-secondary">View Collection</a>
                            </div>
                        </motion.div>

                        <div className="relative hidden lg:block">
                            <div className="arch-container w-full h-[500px] bg-cream-300 overflow-hidden shadow-strong">
                                <img src="https://placehold.co/600x800/E8DCC8/4A3728?text=Premium+Collection" alt="Hero" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-strong max-w-[200px]">
                                <p className="font-serif text-xl text-charcoal mb-1">100% Cotton</p>
                                <p className="font-sans text-xs text-charcoal-muted">Sourced from the finest local artisans.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── GENDER TABS (AMAZON STYLE) ───────────────── */}
            <section id="shop" className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-cream-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-center gap-1 sm:gap-4 py-4">
                        {GENDERS.map(gender => (
                            <button
                                key={gender}
                                onClick={() => handleGender(gender)}
                                className={`px-8 py-2.5 rounded-full font-sans text-sm font-semibold transition-all ${activeGender === gender ? 'bg-charcoal text-cream-100 shadow-lg scale-105' : 'text-charcoal-muted hover:bg-cream-200'}`}
                            >
                                {gender}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ───────────────────────────── */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Category Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategory(cat)}
                                className={`whitespace-nowrap px-5 py-1.5 rounded-full font-sans text-xs font-medium border transition-all ${activeCategory === cat ? 'bg-gold border-gold text-charcoal' : 'bg-transparent border-cream-400 text-charcoal-muted hover:border-charcoal'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <span className="font-sans text-xs text-charcoal-muted uppercase tracking-widest">Sort by:</span>
                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); fetchProducts(activeGender, activeCategory, e.target.value); }}
                            className="bg-transparent border-none font-sans text-sm font-semibold text-charcoal focus:ring-0 cursor-pointer"
                        >
                            <option value="newest">New Arrivals</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="arch-container aspect-[3/4] bg-cream-300 mb-4"></div>
                                <div className="h-4 bg-cream-300 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-cream-300 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {products.map((product, i) => (
                            <ProductCard key={product._id} product={product} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <p className="font-serif text-3xl text-charcoal-muted mb-2">Coming Soon</p>
                        <p className="font-sans text-charcoal-muted">We're crafting new {activeGender}'s {activeCategory} right now.</p>
                    </div>
                )}
            </main>

            {/* ── DISCOVER SECTION ───────────────────────── */}
            <section className="bg-charcoal py-24 text-cream-100 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <h2 className="font-serif text-4xl md:text-6xl mb-8">Premium Local Artisan</h2>
                    <p className="font-sans text-cream-400 max-w-2xl mx-auto mb-12 text-lg">
                        Each garment is a masterpiece of local craftsmanship, designed to make you feel as good as you look.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { title: 'Ethically Made', desc: 'Supporting local artisans and fair trade practices.' },
                            { title: 'Quality Graded', desc: 'Rigorous checks to ensure long-lasting durability.' },
                            { title: 'Global Style', desc: 'Modern designs inspired by worldwide fashion trends.' }
                        ].map(item => (
                            <div key={item.title}>
                                <h3 className="font-serif text-xl mb-4 text-gold">{item.title}</h3>
                                <p className="font-sans text-cream-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
