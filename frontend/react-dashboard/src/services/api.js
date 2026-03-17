// src/services/api.js
// --------------------------------------------------
// Central Axios instance. All API calls go through
// here so auth headers and base URL are applied once.
// --------------------------------------------------
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://cloud-it-service-dashboard.onrender.com/docs';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 ────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (data)            => api.post('/auth/register', data),
  me:       ()                => api.get('/auth/me'),
};

// ── Tickets ──────────────────────────────────────────
export const ticketsAPI = {
  create:     (data)           => api.post('/tickets/', data),
  list:       (params)         => api.get('/tickets/', { params }),
  get:        (id)             => api.get(`/tickets/${id}`),
  update:     (id, data)       => api.put(`/tickets/${id}`, data),
  addComment: (id, data)       => api.post(`/tickets/${id}/comments`, data),
};

// ── Analytics ────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/'),
};

// ── Users (admin) ────────────────────────────────────
export const usersAPI = {
  list:   ()     => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  remove: (id)   => api.delete(`/users/${id}`),
};

export default api;
