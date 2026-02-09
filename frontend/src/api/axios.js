import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/',
    withCredentials: true,
    timeout: 15000, // 15 seconds timeout
});

api.interceptors.request.use((config) => {
    // Log the request for debugging
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);

    // Priority: adminToken -> token
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn("[API Request] No token found in LocalStorage (checked adminToken & token)");
    }
    return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('[API Error] Request timed out');
        }

        // check for HTML response (often means 404/wrong URL)
        if (error.response && error.response.headers && error.response.headers['content-type'] && error.response.headers['content-type'].includes('text/html')) {
            console.error('[API Error] Received HTML response instead of JSON. Check API URL configuration.');
        }

        return Promise.reject(error);
    }
);

export default api;
