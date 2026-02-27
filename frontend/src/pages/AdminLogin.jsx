import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
    const [form, setForm] = useState({ email: 'admin@tcs.com', password: 'Admin@123' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { adminLogin } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) {
            setError('Email and password are required');
            return;
        }

        setLoading(true);
        try {
            // Use adminLogin from AuthContext so it updates user state
            // (required for ProtectedRoute to allow access to /admin)
            const result = await adminLogin(form.email, form.password);
            if (result.success) {
                toast.success('Welcome back, Admin! 👑');
                navigate('/admin', { replace: true });
            } else {
                setError(result.message || 'Invalid admin credentials');
                toast.error(result.message || 'Login failed');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-cream-100 flex items-center justify-center p-4">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-charcoal to-charcoal-muted flex items-center justify-center mx-auto mb-4">
                        <span className="font-serif text-3xl font-bold text-gold">TCS</span>
                    </div>
                    <h1 className="font-serif text-3xl text-charcoal mb-2">Admin Portal</h1>
                    <p className="text-charcoal-muted text-sm">Manage your fashion empire</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-charcoal mb-2">Email Address</label>
                        <div className="relative">
                            <FiMail className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                            <input
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-cream-200 hover:border-cream-300 focus:border-gold focus:outline-none transition-all bg-cream-50 placeholder-charcoal-muted"
                                placeholder="admin@tcs.com"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-charcoal mb-2">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-3.5 text-charcoal-muted w-5 h-5" />
                            <input
                                className="w-full pl-12 pr-12 py-3 rounded-2xl border-2 border-cream-200 hover:border-cream-300 focus:border-gold focus:outline-none transition-all bg-cream-50 placeholder-charcoal-muted"
                                placeholder="••••••••"
                                type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(s => !s)}
                                className="absolute right-4 top-3.5 text-charcoal-muted hover:text-charcoal transition-colors"
                            >
                                {showPass ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-charcoal to-charcoal-muted hover:shadow-lg text-cream-100 font-medium py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cream-100 border-t-transparent" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In to Admin Panel'
                        )}
                    </motion.button>

                    {/* Divider */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-cream-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-charcoal-muted font-medium">Demo Credentials</span>
                        </div>
                    </div>

                    {/* Demo Info */}
                    <div className="bg-cream-50 rounded-2xl p-4 space-y-2 text-sm">
                        <p className="text-charcoal-muted">
                            <strong>Email:</strong> <span className="font-mono text-charcoal">admin@tcs.com</span>
                        </p>
                        <p className="text-charcoal-muted">
                            <strong>Password:</strong> <span className="font-mono text-charcoal">Admin@123</span>
                        </p>
                    </div>
                </form>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <p className="text-charcoal-muted text-sm">
                        Go back to{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-gold font-medium hover:text-gold-dark transition-colors"
                        >
                            home
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
