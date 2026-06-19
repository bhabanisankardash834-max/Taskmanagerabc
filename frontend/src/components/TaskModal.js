// ============================================================
// src/components/TaskModal.js - Create / Edit Task Modal
// A modal form for creating new tasks or editing existing ones
// ============================================================

import React, { useState, useEffect } from "react";
import { useTask } from "../context/TaskContext";
import "./TaskModal.css";

const TaskModal = ({ mode, task, onClose }) => {
  const { createTask, updateTask } = useTask();
  const isEdit = mode === "edit";

  // Form state initialized from existing task (if editing)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    completed: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If editing, pre-fill form with existing task data
  useEffect(() => {
    if (isEdit && task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        // Format date for the date input (YYYY-MM-DD)
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        completed: task.completed || false,
      });
    }
  }, [isEdit, task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return setError("Task title is required");
    }

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        await updateTask(task._id, formData);
      } else {
        await createTask(formData);
      }
      onClose(); // Close modal on success
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      // Close modal when clicking the backdrop
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content task-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "✏️ Edit Task" : "✨ New Task"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Error */}
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="task-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={handleChange}
              required
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Add more details (optional)"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="form-input"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Completed toggle (only shown when editing) */}
          {isEdit && (
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                name="completed"
                id="completed"
                checked={formData.completed}
                onChange={handleChange}
                className="form-checkbox"
              />
              <label htmlFor="completed" className="form-checkbox-label">
                Mark as completed
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
