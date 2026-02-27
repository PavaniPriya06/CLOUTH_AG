import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiPackage, FiCheck } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const statusClass = {
    Pending: 'status-pending', Confirmed: 'status-confirmed',
    Processing: 'status-processing', Shipped: 'status-shipped',
    Delivered: 'status-delivered', Cancelled: 'status-cancelled'
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        api.get('/orders/my').then(({ data }) => { setOrders(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const downloadReceipt = async (orderId, orderNumber) => {
        try {
            const res = await api.get(`/orders/${orderId}/receipt`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url; a.download = `TCS-Receipt-${orderNumber}.pdf`; a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Could not download receipt');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold"></div>
        </div>
    );

    if (orders.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-cream-100">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="w-32 h-32 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FiPackage className="w-16 h-16 text-charcoal-muted" />
                </div>
                <h2 className="font-serif text-4xl text-charcoal mb-4">No Orders Yet</h2>
                <p className="font-sans text-charcoal-muted mb-8">Start shopping to see your orders here.</p>
                <a href="/" className="btn-primary">Explore Collection</a>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen pt-20 bg-cream-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="font-serif text-4xl text-charcoal mb-8">My Orders</h1>
                <div className="space-y-4">
                    {orders.map((order, i) => {
                        const stepIdx = STATUS_STEPS.indexOf(order.status);
                        return (
                            <motion.div key={order._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                className="card overflow-hidden">
                                {/* Header */}
                                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                    onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-serif text-lg text-charcoal">#{order.orderNumber}</h3>
                                            <span className={statusClass[order.status] || 'status-pending'}>{order.status}</span>
                                        </div>
                                        <p className="font-sans text-sm text-charcoal-muted">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            {' • '}{order.items?.length} item(s)
                                            {' • '}₹{order.totalAmount?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={e => { e.stopPropagation(); downloadReceipt(order._id, order.orderNumber); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-cream-400 text-sm font-sans text-charcoal hover:bg-cream-200 transition-colors"
                                        >
                                            <FiDownload className="w-4 h-4" /> Receipt
                                        </button>
                                        <span className="text-charcoal-muted text-sm">{expanded === order._id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expanded === order._id && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-cream-200 p-5">
                                        {/* Progress tracker */}
                                        {order.status !== 'Cancelled' && (
                                            <div className="mb-6">
                                                <div className="flex items-center">
                                                    {STATUS_STEPS.map((s, idx) => (
                                                        <div key={s} className="flex items-center flex-1 last:flex-none">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx <= stepIdx ? 'bg-charcoal text-cream-100' : 'bg-cream-200 text-charcoal-muted'}`}>
                                                                {idx < stepIdx ? <FiCheck className="w-4 h-4" /> : idx + 1}
                                                            </div>
                                                            {idx < STATUS_STEPS.length - 1 && (
                                                                <div className={`flex-1 h-0.5 mx-1 transition-all ${idx < stepIdx ? 'bg-charcoal' : 'bg-cream-300'}`} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    {STATUS_STEPS.map((s, idx) => (
                                                        <span key={s} className={`text-xs font-sans ${idx <= stepIdx ? 'text-charcoal' : 'text-charcoal-muted'}`}>{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className="space-y-3">
                                            {order.items?.map((item, j) => (
                                                <div key={j} className="flex items-center gap-3 bg-cream-100 rounded-2xl p-3">
                                                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-cream-300 flex-shrink-0">
                                                        <img src={item.image ? `http://localhost:5000${item.image}` : `https://placehold.co/56x64/F5F0E8/4A3728?text=${encodeURIComponent(item.name || 'Item')}`}
                                                            alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-serif text-charcoal">{item.name}</p>
                                                        <p className="font-sans text-xs text-charcoal-muted">Size: {item.size} | Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-sans font-semibold text-charcoal">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Shipping address */}
                                        {order.shippingAddress && (
                                            <div className="mt-4 p-4 bg-cream-100 rounded-2xl">
                                                <p className="font-sans text-xs text-charcoal-muted uppercase tracking-wide mb-1">Delivered to</p>
                                                <p className="font-sans text-sm text-charcoal">
                                                    {order.shippingAddress.name}, {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
