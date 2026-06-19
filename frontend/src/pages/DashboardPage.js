// ============================================================
// src/pages/DashboardPage.js - Main Dashboard
// Shows stats, filters, task list, and handles modals
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import StatsBar from "../components/StatsBar";
import TaskFilters from "../components/TaskFilters";
import TaskList from "../components/TaskList";
import TaskModal from "../components/TaskModal";
import "./DashboardPage.css";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { fetchTasks, fetchStats, filters, deleteAllCompleted } = useTask();

  // Modal state: null = closed, 'create' = new task, task object = edit task
  const [modalState, setModalState] = useState(null);

  // -------------------------------------------------------
  // Fetch tasks and stats when component mounts
  // Also re-fetch whenever filters change
  // -------------------------------------------------------
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // filters are a dependency via useCallback

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      {/* -------------------------------------------------------
          HEADER / NAVBAR
          ------------------------------------------------------- */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-icon">✅</span>
          <span className="brand-name">TaskFlow</span>
        </div>

        <div className="header-user">
          <div className="user-avatar">
            {/* Show first letter of user's name */}
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">Hi, {user?.name?.split(" ")[0]}!</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------
          MAIN CONTENT
          ------------------------------------------------------- */}
      <main className="dashboard-main">
        {/* Page Title */}
        <div className="dashboard-title-row">
          <div>
            <h1 className="dashboard-title">My Tasks</h1>
            <p className="dashboard-subtitle">Stay organized, stay productive.</p>
          </div>
          <div className="title-actions">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm("Delete all completed tasks?")) {
                  deleteAllCompleted();
                }
              }}
            >
              🗑 Clear Completed
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setModalState("create")}
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsBar />

        {/* Filter / Search / Sort Controls */}
        <TaskFilters />

        {/* Task List */}
        <TaskList onEditTask={(task) => setModalState(task)} />
      </main>

      {/* -------------------------------------------------------
          TASK MODAL (Create / Edit)
          ------------------------------------------------------- */}
      {modalState !== null && (
        <TaskModal
          mode={modalState === "create" ? "create" : "edit"}
          task={modalState !== "create" ? modalState : null}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
