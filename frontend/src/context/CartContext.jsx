import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tcs_cart')) || []; } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('tcs_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product, size = 'Free Size', color = '', quantity = 1) => {
        setItems(prev => {
            const key = `${product._id}-${size}-${color}`;
            const existing = prev.find(i => i.key === key);
            if (existing) {
                toast.success('Quantity updated!');
                return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i);
            }
            toast.success(`${product.name} added to cart!`);
            return [...prev, {
                key,
                product: product._id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || '',
                size,
                color,
                quantity
            }];
        });
    };

    const removeFromCart = (key) => {
        setItems(prev => prev.filter(i => i.key !== key));
        toast('Item removed from cart', { icon: '🗑️' });
    };

    const updateQuantity = (key, qty) => {
        if (qty < 1) return removeFromCart(key);
        setItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i));
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingCharge = totalAmount > 999 ? 0 : 49;
    const grandTotal = totalAmount + shippingCharge;

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, shippingCharge, grandTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
