import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiUser, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'New Arrivals', href: '/?filter=newArrivals' },
        { label: 'Co-ord Sets', href: '/?category=Co-ord+Sets' },
        { label: 'Tops', href: '/?category=Tops' },
        { label: 'Sale', href: '/?category=Sale' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-soft py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center group-hover:bg-gold transition-colors duration-300">
                            <span className="text-cream-100 font-serif font-bold text-sm">TCS</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="font-serif text-xl text-charcoal leading-none">The Co-ord Set</p>
                            <p className="font-serif text-xl text-charcoal leading-none italic">Studio</p>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="font-sans text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors duration-200 relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 rounded-full hover:bg-cream-300 transition-colors duration-200">
                            <FiShoppingBag className="w-5 h-5 text-charcoal" />
                            {totalItems > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-charcoal text-xs font-bold rounded-full flex items-center justify-center font-sans"
                                >
                                    {totalItems}
                                </motion.span>
                            )}
                        </Link>

                        {/* User */}
                        <div className="relative">
                            <button
                                onClick={() => user ? setUserMenuOpen(!userMenuOpen) : navigate('/auth')}
                                className="p-2 rounded-full hover:bg-cream-300 transition-colors duration-200"
                            >
                                {user?.avatar
                                    ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    : <FiUser className="w-5 h-5 text-charcoal" />
                                }
                            </button>
                            <AnimatePresence>
                                {userMenuOpen && user && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-12 w-52 bg-cream-50 rounded-2xl shadow-medium border border-cream-300 overflow-hidden z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-cream-300">
                                            <p className="font-sans font-medium text-charcoal text-sm truncate">{user.name}</p>
                                            <p className="font-sans text-charcoal-muted text-xs truncate">{user.email || user.phone}</p>
                                        </div>
                                        {isAdmin && (
                                            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm font-sans text-charcoal hover:bg-cream-200 transition-colors">
                                                ⚙️ Admin Dashboard
                                            </Link>
                                        )}
                                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm font-sans text-charcoal hover:bg-cream-200 transition-colors">
                                            📦 My Orders
                                        </Link>
                                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-sans text-red-600 hover:bg-cream-200 transition-colors border-t border-cream-300">
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Admin Login - show when not authenticated */}
                        {!user && (
                            <Link
                                to="/admin/login"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-charcoal text-cream-100 hover:bg-charcoal-muted transition-colors font-sans text-xs font-medium"
                            >
                                Admin
                            </Link>
                        )}

                        {/* Mobile menu toggle */}
                        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-full hover:bg-cream-300 transition-colors">
                            {menuOpen ? <FiX className="w-5 h-5 text-charcoal" /> : <FiMenu className="w-5 h-5 text-charcoal" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden overflow-hidden"
                        >
                            <div className="pt-4 pb-2 flex flex-col gap-2">
                                {navLinks.map(link => (
                                    <Link key={link.label} to={link.href} onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl font-sans text-charcoal hover:bg-cream-200 transition-colors">
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
