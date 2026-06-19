// ============================================================
// src/components/TaskList.js - Renders the list of task cards
// ============================================================

import React from "react";
import { useTask } from "../context/TaskContext";
import TaskCard from "./TaskCard";
import "./TaskList.css";

const TaskList = ({ onEditTask }) => {
  const { tasks, loading } = useTask();

  // Loading state
  if (loading) {
    return (
      <div className="task-list-empty">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <div className="empty-illustration">📭</div>
        <h3>No tasks found</h3>
        <p>Create a new task or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onEdit={() => onEditTask(task)}
        />
      ))}
    </div>
  );
};

export default TaskList;
