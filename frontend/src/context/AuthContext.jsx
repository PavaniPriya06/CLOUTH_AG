import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tcs_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    const login = async (emailOrPhone, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { emailOrPhone, password });
            localStorage.setItem('tcs_token', data.token);
            localStorage.setItem('tcs_user', JSON.stringify(data));
            setUser(data);
            return { success: true, data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, phone, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, email, phone, password });
            localStorage.setItem('tcs_token', data.token);
            localStorage.setItem('tcs_user', JSON.stringify(data));
            setUser(data);
            return { success: true, data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    const adminLogin = async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/admin/login', { email, password });
            localStorage.setItem('tcs_token', data.token);
            localStorage.setItem('tcs_user', JSON.stringify(data));
            if (data.adminSettings) {
                localStorage.setItem('tcs_admin_settings', JSON.stringify(data.adminSettings));
            }
            setUser(data);
            return { success: true, data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Admin login failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('tcs_token');
        localStorage.removeItem('tcs_user');
        localStorage.removeItem('tcs_admin_settings');
        setUser(null);
    };

    // Handle OAuth callback
    const handleOAuthCallback = (token) => {
        localStorage.setItem('tcs_token', token);
        api.get('/auth/me').then(({ data }) => {
            localStorage.setItem('tcs_user', JSON.stringify(data));
            setUser(data);
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, adminLogin, logout, handleOAuthCallback, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
