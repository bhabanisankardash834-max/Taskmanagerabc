// ============================================================
// src/pages/LoginPage.js - Login Page
// Handles user login form with validation
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import "./AuthPages.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authAPI.login(formData);
      // Save token and user via context
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-blob blob-1"></div>
      <div className="auth-blob blob-2"></div>
      <div className="auth-blob blob-3"></div>

      <div className="auth-card">
        {/* Logo / Branding */}
        <div className="auth-header">
          <div className="auth-logo">✅</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your TaskFlow account</p>
        </div>

        {/* Error Message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Link to Register */}
        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
