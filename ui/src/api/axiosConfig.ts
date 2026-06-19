import axios, { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: '',
});

const triggerSessionExpired = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:session-expired'));
};

const attachAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
    if (!config.headers) {
        config.headers = new AxiosHeaders();
    }
    if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${token}`);
    } else {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return config;
    }

    try {
        const decoded = jwtDecode<{ exp?: number }>(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
            triggerSessionExpired();
            return Promise.reject(new Error('Token expired'));
        }

        return attachAuthHeader(config, token);
    } catch (error) {
        triggerSessionExpired();
        return Promise.reject(error);
    }
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const hadAuthHeader = Boolean(error.config?.headers?.Authorization
            || error.config?.headers?.get?.('Authorization'));

        if (error.response?.status === 401 && hadAuthHeader) {
            triggerSessionExpired();
        }
        return Promise.reject(error);
    }
);

export default api;
