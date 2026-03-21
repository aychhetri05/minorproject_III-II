// src/services/api.js
// Centralized API service using Axios
// All backend calls go through here

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000
});

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally — auto logout if token expires
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ---- Auth ----
export const registerUser = (data)  => api.post('/register', data);
export const loginUser    = (data)  => api.post('/login', data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const resetPassword = (token, data) => api.post(`/reset-password/${token}`, data);

// ---- Items ----
export const getAllItems   = ()      => api.get('/items');
export const getOpenItems  = ()      => api.get('/items/open');
export const getItemById   = (id)    => api.get(`/items/${id}`);
export const createItem    = (data)  => api.post('/items', data); // FormData for image upload

// ---- Admin ----
export const getAdminStats   = ()       => api.get('/admin/stats');
export const getAdminMatches = ()       => api.get('/admin/matches');
export const updateStatus    = (id, s)  => api.patch(`/items/${id}/status`, { status: s });

// ---- Police ----
export const getPoliceItems   = (params) => api.get('/police/items', { params });
export const getPoliceMatches = ()       => api.get('/police/matches');
export const getPendingPhysical = ()    => api.get('/police/pending-physical');
export const verifyMatch      = (id, data) => api.post(`/police/matches/${id}/verify`, data);
export const rejectMatch      = (id, data) => api.post(`/police/matches/${id}/reject`, data);
export const markItemStored   = (id, data) => api.post(`/police/items/${id}/store`, data);
export const markItemClosed   = (id, data) => api.post(`/police/items/${id}/close`, data);
export const verifyPhysical   = (id, data) => api.put(`/police/items/${id}/verify-physical`, data);
export const submitPhysical   = (itemId, data) => api.post(`/items/${itemId}/submit-physical`, data);

export const getPoliceSubmissions = () => api.get('/police/submissions');
export const acceptSubmission = (id, data) => api.post(`/police/submissions/${id}/accept`, data);
export const rejectSubmission = (id, data) => api.post(`/police/submissions/${id}/reject`, data);

// ---- Admin ----
export const createPoliceUser = (data) => api.post('/admin/create-police', data);

// ---- Users ----
export const getProfile    = ()      => api.get('/users/profile');
export const updateProfile = (data)  => api.put('/users/profile', data); // FormData for image upload

// ---- Notifications ----
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

export default api;
