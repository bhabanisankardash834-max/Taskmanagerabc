// ============================================================
// src/components/StatsBar.js - Task Statistics Dashboard
// Displays 4 stat cards: Total, Completed, Pending, Overdue
// ============================================================

import React from "react";
import { useTask } from "../context/TaskContext";
import "./StatsBar.css";

// Each stat card configuration
const STAT_CARDS = [
  {
    key: "total",
    label: "Total Tasks",
    icon: "📋",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    shadow: "rgba(102, 126, 234, 0.3)",
  },
  {
    key: "completed",
    label: "Completed",
    icon: "✅",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    shadow: "rgba(67, 233, 123, 0.3)",
  },
  {
    key: "pending",
    label: "Pending",
    icon: "⏳",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    shadow: "rgba(240, 147, 251, 0.3)",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: "🚨",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    shadow: "rgba(250, 112, 154, 0.3)",
  },
];

const StatsBar = () => {
  const { stats } = useTask();

  return (
    <div className="stats-bar">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="stat-card"
          style={{ "--card-shadow": card.shadow }}
        >
          {/* Gradient background strip at top */}
          <div
            className="stat-card-accent"
            style={{ background: card.gradient }}
          ></div>

          <div className="stat-card-body">
            <span className="stat-icon">{card.icon}</span>
            <div className="stat-info">
              {/* The number - animates when it changes */}
              <span className="stat-number">{stats[card.key] ?? 0}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
