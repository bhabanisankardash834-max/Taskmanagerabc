// ============================================================
// src/components/TaskCard.js - Individual Task Card
// Displays task info, priority badge, actions (edit/delete/toggle)
// ============================================================

import React from "react";
import { useTask } from "../context/TaskContext";
import "./TaskCard.css";

// Helper: format date nicely
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper: check if a date is overdue
const isOverdue = (dateStr, completed) => {
  if (!dateStr || completed) return false;
  return new Date(dateStr) < new Date();
};

const TaskCard = ({ task, onEdit }) => {
  const { toggleTask, deleteTask } = useTask();
  const overdue = isOverdue(task.dueDate, task.completed);

  return (
    <div
      className={`task-card ${task.completed ? "completed" : ""} ${overdue ? "overdue" : ""}`}
    >
      {/* Left: Checkbox to toggle completion */}
      <button
        className={`task-checkbox ${task.completed ? "checked" : ""}`}
        onClick={() => toggleTask(task._id)}
        title={task.completed ? "Mark as pending" : "Mark as complete"}
      >
        {task.completed && "✓"}
      </button>

      {/* Center: Task Content */}
      <div className="task-content">
        <div className="task-header">
          <h3 className={`task-title ${task.completed ? "strikethrough" : ""}`}>
            {task.title}
          </h3>
          {/* Priority Badge */}
          <span className={`badge badge-${task.priority?.toLowerCase()}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          {task.dueDate && (
            <span className={`task-due ${overdue ? "task-due-overdue" : ""}`}>
              📅 {overdue ? "⚠️ Overdue · " : ""}
              {formatDate(task.dueDate)}
            </span>
          )}

          <span className={`badge ${task.completed ? "badge-completed" : "badge-pending"}`}>
            {task.completed ? "Completed" : "Pending"}
          </span>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="task-actions">
        <button
          className="btn btn-ghost btn-icon task-action-btn"
          onClick={onEdit}
          title="Edit task"
        >
          ✏️
        </button>
        <button
          className="btn btn-icon task-action-btn task-delete-btn"
          onClick={() => {
            if (window.confirm("Delete this task?")) {
              deleteTask(task._id);
            }
          }}
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
