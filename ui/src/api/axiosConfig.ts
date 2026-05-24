import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

// Trigger the custom event instead of hard-redirecting
const triggerSessionExpired = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:session-expired'));
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp && decoded.exp < currentTime) {
                triggerSessionExpired();
                return Promise.reject(new Error("Token expired"));
            }
            
            if (config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            triggerSessionExpired();
            return Promise.reject(error);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        triggerSessionExpired();
    }
    return Promise.reject(error);
});

export default api;