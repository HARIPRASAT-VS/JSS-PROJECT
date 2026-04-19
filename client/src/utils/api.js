import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the auth token and potentially child ID for parents
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        
        // Add selected child ID for parent portal requests
        const selectedChild = localStorage.getItem('selectedChildId');
        if (selectedChild) {
            config.headers['x-child-id'] = selectedChild;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
