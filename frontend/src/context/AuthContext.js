// ============================================================
// src/context/AuthContext.js - Global Authentication State
// React Context provides a way to share state (user, token)
// across all components without prop drilling.
// ============================================================

import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

// Create the context object
const AuthContext = createContext();

// -------------------------------------------------------
// AuthProvider Component
// Wraps the entire app and provides auth state to all children
// -------------------------------------------------------
export const AuthProvider = ({ children }) => {
  // State: current logged-in user object
  const [user, setUser] = useState(null);

  // State: whether we're still checking if user is logged in
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // On app load: check if a token exists in localStorage
  // If yes, verify it and restore the user session
  // -------------------------------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Verify the token is still valid by calling /api/auth/me
          const res = await authAPI.getMe();
          setUser(res.data.user);
        } catch {
          // Token is invalid/expired, clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // -------------------------------------------------------
  // LOGIN: Save token and user to state + localStorage
  // -------------------------------------------------------
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // -------------------------------------------------------
  // LOGOUT: Clear token and user from state + localStorage
  // -------------------------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,        // Current user object (null if not logged in)
        loading,     // True while checking auth status
        login,       // Call this after successful login
        logout,      // Call this to log out
        isLoggedIn: !!user, // Boolean shortcut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context in any component
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
