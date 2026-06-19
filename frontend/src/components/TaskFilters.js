// ============================================================
// src/components/TaskFilters.js - Filter, Search & Sort Bar
// ============================================================

import React from "react";
import { useTask } from "../context/TaskContext";
import "./TaskFilters.css";

const TaskFilters = () => {
  const { filters, updateFilter } = useTask();

  return (
    <div className="filters-bar">
      {/* Search Input */}
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="filter-tabs">
        {["all", "pending", "completed"].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filters.status === status ? "active" : ""}`}
            onClick={() => updateFilter("status", status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Priority Filter */}
      <select
        className="form-select filter-select"
        value={filters.priority}
        onChange={(e) => updateFilter("priority", e.target.value)}
      >
        <option value="">All Priorities</option>
        <option value="High">🔴 High</option>
        <option value="Medium">🟡 Medium</option>
        <option value="Low">🟢 Low</option>
      </select>

      {/* Sort Dropdown */}
      <select
        className="form-select filter-select"
        value={filters.sort}
        onChange={(e) => updateFilter("sort", e.target.value)}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="priority">By Priority</option>
        <option value="dueDate">By Due Date</option>
      </select>
    </div>
  );
};

export default TaskFilters;
