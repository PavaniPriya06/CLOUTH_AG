import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const { login, register, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let result;
        if (mode === 'login') {
            result = await login(form.email || form.phone, form.password);
        } else {
            if (!form.name) return setError('Name is required');
            if (!form.email && !form.phone) return setError('Email or phone is required');
            result = await register(form.name, form.email, form.phone, form.password);
        }
        if (result.success) navigate('/');
        else setError(result.message);
    };

    const handleFacebook = () => {
        window.location.href = '/api/auth/facebook';
    };

    return (
        <div className="min-h-screen bg-cream-gradient flex">
            {/* Left panel (decorative) */}
            <div className="hidden lg:flex flex-1 bg-charcoal-gradient items-center justify-center p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-gold/8 rounded-full -translate-x-1/3 translate-y-1/3" />
                <div className="text-center z-10">
                    <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="font-serif text-3xl font-bold text-charcoal">TCS</span>
                    </div>
                    <h2 className="font-serif text-5xl text-cream-100 mb-6">The Co-ord<br /><em>Set Studio</em></h2>
                    <p className="font-sans text-cream-400 text-lg max-w-sm mx-auto leading-relaxed">
                        Discover premium artisan clothing crafted with love for the modern soul.
                    </p>
                    <div className="mt-12 flex flex-col gap-4">
                        {[['✦', 'Premium Quality Fabrics'], ['⚡', 'Fast, Free Delivery'], ['↩', '7-Day Easy Returns']].map(([icon, text]) => (
                            <div key={text} className="flex items-center gap-3 text-cream-300 font-sans text-sm">
                                <span className="text-gold">{icon}</span> {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel (form) */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-serif text-xl font-bold text-cream-100">TCS</span>
                        </div>
                        <h1 className="font-serif text-3xl text-charcoal">The Co-ord Set Studio</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-cream-200 rounded-2xl p-1 mb-8">
                        {['login', 'register'].map(tab => (
                            <button key={tab} onClick={() => { setMode(tab); setError(''); }}
                                className={`flex-1 py-3 rounded-xl font-sans text-sm font-medium transition-all duration-300 capitalize ${mode === tab ? 'bg-white shadow-soft text-charcoal' : 'text-charcoal-muted hover:text-charcoal'}`}>
                                {tab === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleSubmit} className="space-y-4">

                            {mode === 'register' && (
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                                    <input className="input-field pl-12" placeholder="Full Name *" value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                            )}

                            <div className="relative">
                                <FiMail className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                                <input className="input-field pl-12" placeholder={mode === 'register' ? 'Email Address' : 'Email or Phone'}
                                    type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>

                            {mode === 'register' && (
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                                    <input className="input-field pl-12" placeholder="Phone Number"
                                        type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                            )}

                            <div className="relative">
                                <FiLock className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                                <input className="input-field pl-12 pr-12" placeholder="Password *"
                                    type={showPass ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-4 top-3.5 text-charcoal-muted hover:text-charcoal">
                                    {showPass ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>

                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-red-600 text-sm font-sans bg-red-50 px-4 py-2 rounded-xl">{error}</motion.p>
                            )}

                            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 disabled:opacity-70">
                                {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream-100" /> : null}
                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                            </motion.button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-cream-400"></div>
                                <span className="font-sans text-xs text-charcoal-muted">or continue with</span>
                                <div className="flex-1 h-px bg-cream-400"></div>
                            </div>

                            {/* Social login */}
                            <motion.button type="button" onClick={handleFacebook} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-cream-400 bg-cream-50 hover:bg-cream-200 transition-all duration-200 font-sans text-sm font-medium text-charcoal">
                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                Continue with Facebook
                            </motion.button>

                            <p className="text-center font-sans text-sm text-charcoal-muted">
                                {mode === 'login' ? "Don't have an account? " : 'Already a member? '}
                                <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                                    className="text-gold font-medium hover:text-gold-dark transition-colors">
                                    {mode === 'login' ? 'Sign up free' : 'Sign in'}
                                </button>
                            </p>
                        </motion.form>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
