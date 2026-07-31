import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.kingcreativestudio.my.id/ramahlistrik/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to automatically append JWT Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ramah_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ramah_token');
      localStorage.removeItem('ramah_user');
    }
    return Promise.reject(error);
  }
);
