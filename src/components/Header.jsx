/* ========================================
   HEADER — month pill, week label, nav arrows
   ======================================== */
import React from "react";
import { monthYearLabel, weekNumLabel, fmtShortDate, adjacentWeek } from "../store";

export default function Header({ weekStart, onNavigate, dark, onToggleDark }) {
  const monthYear = monthYearLabel(weekStart);
  const weekNum = weekNumLabel(weekStart);

  // Compute end of week (Sunday)
  const endDate = new Date(weekStart + "T00:00:00");
  endDate.setDate(endDate.getDate() + 6);
  const startLabel = fmtShortDate(new Date(weekStart + "T00:00:00"));
  const endLabel = fmtShortDate(endDate);

  return (
    <div className="flex flex-col items-center w-full no-interact relative">
      {/* Month + Year pill */}
      <div
        className="rounded-full px-5 py-0.5 mb-1"
        style={{ background: 'rgba(184,201,163,0.3)', pointerEvents: "none" }}
      >
        <span
          className="font-hand text-xl font-semibold"
          style={{ color: "#6b8a5e" }}
        >
          {monthYear}
        </span>
      </div>

      {/* Week label + nav arrows */}
      <div className="flex items-center gap-3 mt-0.5">
        <button
          className="nav-arrow no-interact"
          style={{ color: 'var(--color-dusty-blue)', pointerEvents: "auto" }}
          onClick={() => onNavigate(adjacentWeek(weekStart, -1))}
          aria-label="Previous week"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span
          className="font-hand text-lg tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          WEEK {weekNum} · {startLabel} → {endLabel}
        </span>

        <button
          className="nav-arrow no-interact"
          style={{ color: 'var(--color-dusty-blue)', pointerEvents: "auto" }}
          onClick={() => onNavigate(adjacentWeek(weekStart, 1))}
          aria-label="Next week"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="absolute right-0 top-0 rounded-full flex items-center justify-center cursor-pointer"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          width: 'clamp(36px, 8vw, 44px)',
          height: 'clamp(36px, 8vw, 44px)',
          background: dark ? "rgba(160,144,128,0.25)" : "rgba(155,180,201,0.2)",
          border: "1px solid var(--border-strong)",
          pointerEvents: "auto",
          transition: "background 0.3s ease",
        }}
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span style={{ fontSize: "16px" }}>{dark ? "☀️" : "🌙"}</span>
      </button>

      {/* Thin divider */}
      <div
        className="w-full mt-2"
        style={{ borderTop: "1.5px dashed var(--border-strong)", opacity: 0.6 }}
      />
    </div>
  );
}
