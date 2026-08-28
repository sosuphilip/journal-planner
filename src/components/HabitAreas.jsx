/* ========================================
   HABIT AREAS — water tracker + habits table
   Lives at bottom of right page.
   Water track: 7 day columns, 4 droplets each.
   Habits: 7-day M-S grid, click cycles empty→check→x→empty.
   ======================================== */
import React, { useState } from "react";
import { uid, fmtDate } from "../store";
import EditableText from "./EditableText";

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

/* ── Water Tracker — per-day droplets ──────── */
function WaterTracker({ waterTrack, weekStart, onWaterChange }) {
  const totalDrops = 4;
  const litersPerDrop = 0.45;

  // Generate dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    return fmtDate(d);
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="font-hand text-sm font-semibold" style={{ color: "var(--color-accent-blue)" }}>
          Water Track
        </span>
        <svg width="14" height="14" viewBox="0 0 20 26" fill="#6a9ec0" opacity="0.5">
          <path d="M10 2 Q10 2 4 14 Q0 20 4 23 Q7 26 10 26 Q13 26 16 23 Q20 20 16 14 Q10 2 10 2Z" />
        </svg>
      </div>

      {/* Day columns: label + 4 droplets + total */}
      <div className="flex gap-2">
        {weekDates.map((dateKey, dayIdx) => {
          const liters = waterTrack[dateKey] || 0;
          const filledCount = Math.round(liters / litersPerDrop);
          return (
            <div key={dateKey} className="flex flex-col items-center gap-0.5">
              <span className="font-hand text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                {DAY_HEADERS[dayIdx]}
              </span>
              <div className="flex gap-px">
                {Array.from({ length: totalDrops }, (_, dropIdx) => {
                  const isFilled = dropIdx < filledCount;
                  return (
                    <button
                      key={dropIdx}
                      onClick={() => {
                        const newVal = (dropIdx + 1) * litersPerDrop;
                        onWaterChange(dateKey, liters === newVal ? 0 : newVal);
                      }}
                      className={`water-drop bg-transparent border-none p-0 cursor-pointer ${isFilled ? "water-drop-filled" : ""}`}
                      style={{ pointerEvents: "auto", width: 12, height: 16 }}
                      title={`${(dropIdx + 1) * litersPerDrop}L`}
                    >
                      <svg width="12" height="16" viewBox="0 0 20 26">
                        <path
                          d="M10 2 Q10 2 4 14 Q0 20 4 23 Q7 26 10 26 Q13 26 16 23 Q20 20 16 14 Q10 2 10 2Z"
                          fill={isFilled ? "#6a9ec0" : "rgba(155,180,201,0.15)"}
                          stroke="#9bb4c9"
                          strokeWidth="0.8"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <span className="font-hand text-[10px]" style={{ color: "var(--color-dusty-blue)" }}>
                {liters > 0 ? `${liters.toFixed(1)}L` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Habits Table ──────────────────────────── */
function HabitsTable({ habits, onHabitsChange }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [pulsingCell, setPulsingCell] = useState(null);

  // Click cycle: empty → check → x → empty
  const cycleCell = (habitId, dayIdx) => {
    setPulsingCell(`${habitId}-${dayIdx}`);
    setTimeout(() => setPulsingCell(null), 250);
    onHabitsChange(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const newDays = [...h.days];
        const current = newDays[dayIdx];
        if (current === false) newDays[dayIdx] = true;
        else if (current === true) newDays[dayIdx] = "x";
        else newDays[dayIdx] = false;
        return { ...h, days: newDays };
      })
    );
  };

  const updateName = (habitId, name) => {
    onHabitsChange(
      habits.map((h) => (h.id === habitId ? { ...h, name } : h))
    );
  };

  const addHabit = () => {
    onHabitsChange([
      ...habits,
      { id: uid(), name: "", days: [false, false, false, false, false, false, false] },
    ]);
  };

  const removeHabit = (habitId) => {
    onHabitsChange(habits.filter((h) => h.id !== habitId));
  };

  return (
    <div className="flex flex-col gap-0.5">
      {/* Header row */}
      <div className="flex items-center gap-0">
        <div className="w-20 shrink-0" />
        {DAY_HEADERS.map((d, i) => (            <div key={i} className="w-6 text-center font-hand text-sm font-bold" style={{ color: "var(--text-muted)", pointerEvents: "none" }}>
            {d}
          </div>
        ))}
        <div className="w-5 shrink-0" />
      </div>

      {/* Habit rows */}
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="flex items-center gap-0 group"
          onMouseEnter={() => setHoveredRow(habit.id)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          {/* Habit name */}
          <div className="w-20 shrink-0">
            <EditableText
              value={habit.name}
              onChange={(name) => updateName(habit.id, name)}
              className="font-hand text-sm"
              style={{ color: "var(--text)" }}
              placeholder="habit..."
            />
          </div>

          {/* Day cells */}
          {habit.days.map((val, dayIdx) => (
            <button
              key={dayIdx}
              onClick={() => cycleCell(habit.id, dayIdx)}
              className={`habit-cell w-6 h-5 flex items-center justify-center bg-transparent border-none text-sm ${pulsingCell === `${habit.id}-${dayIdx}` ? "habit-cell-pulse" : ""}`}
              style={{ pointerEvents: "auto" }}
              title={`${habit.name || "habit"} — ${DAY_HEADERS[dayIdx]}`}
            >
              {val === true ? (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <polyline points="4 10 8 14 16 6" stroke="#6b8a5e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : val === "x" ? (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#c97b7b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#c97b7b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : null}
            </button>
          ))}

          {/* Delete */}
          {hoveredRow === habit.id && (
            <button
              onClick={() => removeHabit(habit.id)}
              className="w-5 text-muted-pink text-xs bg-transparent border-none cursor-pointer opacity-60 hover:opacity-100"
              style={{ pointerEvents: "auto" }}
              title="Remove habit"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add habit */}
      <button
        onClick={addHabit}
        className="text-sage text-sm mt-0.5 bg-transparent border-none cursor-pointer text-left hover:text-muted-red transition-colors"
        style={{ pointerEvents: "auto" }}
      >
        + add habit
      </button>
    </div>
  );
}

/* ── Main Export ────────────────────────────── */
export default function HabitAreas({ habits, waterTrack, weekStart, onHabitsChange, onWaterChange }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center gap-2" style={{ pointerEvents: "none" }}>
        <span
          className="font-hand text-base font-bold tracking-wider uppercase"
          style={{ color: "var(--color-sage)" }}
        >
          habit areas
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#b8c9a3" opacity="0.5">
          <path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
        </svg>
      </div>

      {/* Water tracker */}
      <WaterTracker
        waterTrack={waterTrack}
        weekStart={weekStart}
        onWaterChange={onWaterChange}
      />

      {/* Habits table */}
      <HabitsTable habits={habits} onHabitsChange={onHabitsChange} />
    </div>
  );
}
