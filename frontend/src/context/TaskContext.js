// ============================================================
// src/context/TaskContext.js - Global Task State
// Manages all task data, filters, and API calls.
// All task-related state lives here so any component can use it.
// ============================================================

import React, { createContext, useState, useContext, useCallback } from "react";
import { taskAPI } from "../services/api";
import toast from "react-hot-toast";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);

  // Filter & sort state
  const [filters, setFilters] = useState({
    status: "all",    // all | completed | pending
    priority: "",     // Low | Medium | High | ""
    search: "",       // search string
    sort: "newest",   // newest | oldest | priority | dueDate
  });

  // -------------------------------------------------------
  // FETCH TASKS: Load tasks from backend with current filters
  // useCallback memoizes the function to avoid infinite loops
  // -------------------------------------------------------
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;

      const res = await taskAPI.getAll(params);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // -------------------------------------------------------
  // FETCH STATS
  // -------------------------------------------------------
  const fetchStats = async () => {
    try {
      const res = await taskAPI.getStats();
      setStats(res.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // -------------------------------------------------------
  // CREATE TASK
  // -------------------------------------------------------
  const createTask = async (taskData) => {
    try {
      const res = await taskAPI.create(taskData);
      toast.success("Task created!");
      await fetchTasks();
      await fetchStats();
      return res.data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
      throw err;
    }
  };

  // -------------------------------------------------------
  // UPDATE TASK
  // -------------------------------------------------------
  const updateTask = async (id, taskData) => {
    try {
      const res = await taskAPI.update(id, taskData);
      toast.success("Task updated!");
      await fetchTasks();
      await fetchStats();
      return res.data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
      throw err;
    }
  };

  // -------------------------------------------------------
  // TOGGLE COMPLETION
  // -------------------------------------------------------
  const toggleTask = async (id) => {
    try {
      const res = await taskAPI.toggle(id);
      // Optimistic update: update local state immediately for snappy UI
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? res.data.task : t))
      );
      await fetchStats();
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  // -------------------------------------------------------
  // DELETE SINGLE TASK
  // -------------------------------------------------------
  const deleteTask = async (id) => {
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      await fetchStats();
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  // -------------------------------------------------------
  // DELETE ALL COMPLETED TASKS
  // -------------------------------------------------------
  const deleteAllCompleted = async () => {
    try {
      const res = await taskAPI.deleteCompleted();
      toast.success(res.data.message);
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      toast.error("Failed to delete completed tasks");
    }
  };

  // -------------------------------------------------------
  // UPDATE FILTERS: triggers refetch via useEffect in Dashboard
  // -------------------------------------------------------
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        stats,
        loading,
        filters,
        fetchTasks,
        fetchStats,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        deleteAllCompleted,
        updateFilter,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTask must be used within a TaskProvider");
  return context;
};
