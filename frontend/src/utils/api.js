import axios from 'axios';

// Use environment variable for production, fallback to /api for local dev (Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

// Attach token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('tcs_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('tcs_token');
            localStorage.removeItem('tcs_user');
            window.location.href = '/auth';
        }
        return Promise.reject(err);
    }
);

export default api;
