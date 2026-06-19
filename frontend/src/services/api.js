// ============================================================
// src/services/api.js - Axios API Service
// Central place to configure HTTP requests to the backend.
// Automatically attaches JWT token to every request.
// ============================================================

import axios from "axios";

// Create an axios instance with base URL
// On Netlify, /api/* is redirected to /.netlify/functions/api/*
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

// -------------------------------------------------------
// REQUEST INTERCEPTOR
// Runs before every request - attaches the JWT token
// from localStorage to the Authorization header
// -------------------------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // This is the format the backend expects
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------------
// RESPONSE INTERCEPTOR
// Runs after every response - handles 401 (unauthorized)
// Automatically logs out user if token expires
// -------------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------
// AUTH API CALLS
// -------------------------------------------------------
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  getMe: () => API.get("/auth/me"),
};

// -------------------------------------------------------
// TASK API CALLS
// -------------------------------------------------------
export const taskAPI = {
  // Get all tasks - accepts optional query params for filter/sort/search
  getAll: (params) => API.get("/tasks", { params }),

  // Get statistics
  getStats: () => API.get("/tasks/stats"),

  // Get single task
  getOne: (id) => API.get(`/tasks/${id}`),

  // Create new task
  create: (data) => API.post("/tasks", data),

  // Update task
  update: (id, data) => API.put(`/tasks/${id}`, data),

  // Toggle completion
  toggle: (id) => API.patch(`/tasks/${id}/toggle`),

  // Delete single task
  delete: (id) => API.delete(`/tasks/${id}`),

  // Delete all completed tasks
  deleteCompleted: () => API.delete("/tasks/completed/all"),
};

export default API;
