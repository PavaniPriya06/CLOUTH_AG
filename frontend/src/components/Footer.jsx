import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiHeart } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="bg-charcoal text-cream-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                                <span className="text-charcoal font-serif font-bold">TCS</span>
                            </div>
                            <div>
                                <p className="font-serif text-lg text-cream-100 leading-none">The Co-ord Set</p>
                                <p className="font-serif text-lg text-cream-100 italic leading-none">Studio</p>
                            </div>
                        </div>
                        <p className="text-cream-400 text-sm font-sans leading-relaxed">
                            Premium local artisan clothing crafted with love. Quality pieces for every occasion.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="w-10 h-10 bg-charcoal-light rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                                <FiInstagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-charcoal-light rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                                <FiFacebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="font-serif text-lg text-cream-100 mb-6">Shop</h4>
                        <ul className="space-y-3">
                            {['New Arrivals', 'Co-ord Sets', 'Tops', 'Bottoms', 'Dresses', 'Sale'].map(item => (
                                <li key={item}><Link to={`/?category=${item}`} className="text-cream-400 text-sm font-sans hover:text-gold transition-colors">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h4 className="font-serif text-lg text-cream-100 mb-6">Help</h4>
                        <ul className="space-y-3">
                            {['My Orders', 'Size Guide', 'Returns & Exchange', 'Contact Us', 'FAQ'].map(item => (
                                <li key={item}><a href="#" className="text-cream-400 text-sm font-sans hover:text-gold transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-serif text-lg text-cream-100 mb-6">Contact</h4>
                        <ul className="space-y-3 text-cream-400 text-sm font-sans">
                            <li>📍 Local Artisan District, Your City</li>
                            <li>📞 +91 98765 43210</li>
                            <li>✉️ support@tcs.com</li>
                            <li>🕐 Mon–Sat, 10am – 7pm</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-charcoal-light mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-cream-500 text-sm font-sans">© 2026 TCS – The Co-ord Set Studio. All rights reserved.</p>
                    <p className="text-cream-500 text-sm font-sans flex items-center gap-1">
                        Made with <FiHeart className="text-gold w-4 h-4" /> for local artisans
                    </p>
                </div>
            </div>
        </footer>
    );
}
