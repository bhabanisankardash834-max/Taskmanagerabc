// ============================================================
// src/App.js - Root Component with Routing
// Sets up React Router routes and wraps app with context providers
// ============================================================

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

import "./styles/global.css";

// -------------------------------------------------------
// PrivateRoute: Redirects to login if not authenticated
// -------------------------------------------------------
const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  // Show nothing while checking auth status
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // If logged in, show the page; otherwise redirect to login
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// -------------------------------------------------------
// PublicRoute: Redirects to dashboard if already logged in
// (Prevents logged-in users from seeing login page)
// -------------------------------------------------------
const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Default route: redirect to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected route */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <TaskProvider>
              <DashboardPage />
            </TaskProvider>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toast notification container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e1e2e",
              color: "#cdd6f4",
              border: "1px solid #45475a",
              borderRadius: "12px",
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
