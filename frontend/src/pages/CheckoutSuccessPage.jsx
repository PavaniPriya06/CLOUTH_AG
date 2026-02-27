import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiDownload, FiShoppingBag, FiMapPin, FiHome, FiCheckCircle, FiTruck } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000';

export default function CheckoutSuccessPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!orderId) { navigate('/'); return; }
        
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${orderId}`);
                setOrder(data);
            } catch (err) {
                console.error('Error fetching order:', err);
                toast.error('Order not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, navigate]);

    const handleDownloadInvoice = async () => {
        setDownloading(true);
        try {
            const response = await api.get(`/orders/${orderId}/receipt`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `TCS-Invoice-${order?.orderNumber || orderId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Invoice downloaded!');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Could not download invoice');
        } finally {
            setDownloading(false);
        }
    };

    // Calculate estimated delivery date (3-5 business days)
    const getEstimatedDeliveryDate = () => {
        if (!order?.createdAt) return '';
        const date = new Date(order.createdAt);
        date.setDate(date.getDate() + 5); // Add 5 days (conservative estimate)
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-cream-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="font-sans text-charcoal-muted">Loading your order...</p>
            </div>
        </div>
    );

    const addr = order?.shippingAddress;
    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    }) : 'N/A';

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-200 to-cream-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full max-w-2xl"
            >
                {/* Success Hero */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                        className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <span className="text-5xl">🎉</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="font-serif text-4xl md:text-5xl text-charcoal mb-3"
                    >
                        Order Placed Successfully!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="font-sans text-charcoal-muted text-lg"
                    >
                        We're preparing your order for delivery 📦
                    </motion.p>
                </div>

                {/* Order Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-[2rem] shadow-strong overflow-hidden mb-6"
                >
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-charcoal to-charcoal-light px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-sans text-cream-400 text-xs uppercase tracking-widest mb-1">Order Number</p>
                            <p className="font-serif text-white text-3xl font-bold">#{order?.orderNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-cream-400 text-xs uppercase tracking-widest mb-1">Amount Paid</p>
                            <p className="font-sans text-gold text-3xl font-bold">₹{order?.totalAmount?.toLocaleString()}</p>
                            <p className="font-sans text-cream-300 text-xs mt-1">✅ Payment Confirmed</p>
                        </div>
                    </div>

                    <div className="p-7 space-y-6">
                        {/* Order Date & Status */}
                        <div>
                            <p className="font-sans text-xs font-bold text-charcoal-muted uppercase tracking-widest mb-2">Order Confirmed</p>
                            <p className="font-sans text-sm text-charcoal">{orderDate}</p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-xs font-bold font-sans flex items-center gap-2
                                ${order?.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                <FiCheckCircle className="w-4 h-4" /> Payment: {order?.paymentStatus}
                            </span>
                            <span className="px-4 py-2 rounded-full text-xs font-bold font-sans flex items-center gap-2 bg-blue-100 text-blue-700">
                                <FiTruck className="w-4 h-4" /> Status: {order?.status}
                            </span>
                            <span className="px-4 py-2 rounded-full text-xs font-bold font-sans bg-cream-200 text-charcoal">
                                {order?.paymentMethod}
                            </span>
                        </div>

                        {/* Items */}
                        {order?.items?.length > 0 && (
                            <div>
                                <p className="font-sans text-xs font-bold text-charcoal-muted uppercase tracking-widest mb-3">Items in Order</p>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-cream-100 rounded-2xl p-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                                                <img
                                                    src={item.image ? `${API_URL}${item.image}` : `https://placehold.co/64x64/F5F0E8/4A3728?text=TCS`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-serif text-charcoal text-sm font-medium line-clamp-1">{item.name}</p>
                                                <p className="font-sans text-xs text-charcoal-muted mt-1">
                                                    {item.size ? `Size: ${item.size} | ` : ''}Qty: {item.quantity}
                                                </p>
                                                <p className="font-sans text-xs text-charcoal-muted">
                                                    ₹{item.price.toLocaleString()} each
                                                </p>
                                            </div>
                                            <p className="font-sans font-bold text-charcoal text-sm flex-shrink-0">
                                                ₹{(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Delivery Address */}
                        {addr && (
                            <div>
                                <p className="font-sans text-xs font-bold text-charcoal-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <FiMapPin className="w-4 h-4" /> Delivery Address
                                </p>
                                <div className="bg-cream-100 rounded-2xl p-4 border-2 border-gold">
                                    <p className="font-sans text-sm font-semibold text-charcoal">{addr.fullName || addr.name}</p>
                                    <p className="font-sans text-sm text-charcoal-muted">{addr.phone}</p>
                                    <p className="font-sans text-sm text-charcoal-muted mt-2">
                                        {addr.houseNo}{addr.street ? `, ${addr.street}` : ''}{addr.landmark ? `, near ${addr.landmark}` : ''}
                                    </p>
                                    <p className="font-sans text-sm text-charcoal-muted">
                                        {addr.city}, {addr.state} — {addr.pincode}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Price Breakdown */}
                        <div className="space-y-2 border-t border-cream-200 pt-4">
                            <div className="flex justify-between text-sm font-sans">
                                <span className="text-charcoal-muted">Subtotal</span>
                                <span className="text-charcoal font-medium">
                                    ₹{((order?.totalAmount || 0) - (order?.shippingCharge || 0)).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm font-sans">
                                <span className="text-charcoal-muted">Shipping</span>
                                <span className={order?.shippingCharge === 0 ? 'text-green-600 font-bold' : 'text-charcoal font-medium'}>
                                    {order?.shippingCharge === 0 ? 'FREE 🎁' : `₹${order?.shippingCharge}`}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-cream-200 pt-2 mt-2">
                                <span className="font-sans font-bold text-charcoal">Total</span>
                                <span className="font-sans font-bold text-gold text-lg">₹{order?.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Estimated Delivery */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4">
                            <p className="font-sans font-bold text-blue-900 text-sm mb-1">📦 Estimated Delivery</p>
                            <p className="font-sans text-sm text-blue-800">By {getEstimatedDeliveryDate()} (3-5 business days)</p>
                        </div>

                        {/* What's Next */}
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                            <p className="font-sans font-bold text-green-900 text-sm mb-2">✓ What's Next?</p>
                            <ul className="space-y-1 text-xs text-green-800 font-sans list-inside list-disc">
                                <li>Your order is confirmed and being prepared</li>
                                <li>You'll receive a tracking link via email & SMS</li>
                                <li>Expected delivery within 3-5 business days</li>
                                <li>Download your invoice for records</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <motion.button
                        onClick={handleDownloadInvoice}
                        disabled={downloading}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn-primary flex-1 flex items-center justify-center gap-3 py-4 text-base disabled:opacity-70"
                    >
                        {downloading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <FiDownload className="w-5 h-5" />}
                        {downloading ? 'Generating PDF...' : 'Download Invoice'}
                    </motion.button>

                    <motion.button
                        onClick={() => navigate('/orders')}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2 py-4 text-base"
                    >
                        <FiShoppingBag /> My Orders
                    </motion.button>

                    <motion.button
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn-secondary flex items-center justify-center gap-2 px-6 py-4 text-base"
                    >
                        <FiHome />
                    </motion.button>
                </motion.div>

                <p className="text-center font-sans text-xs text-charcoal-muted mt-6">
                    Questions? Contact us at support@tcs.com | +91 98765 43210
                </p>
            </motion.div>
        </div>
    );
}
