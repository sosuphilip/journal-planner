/* ========================================
   APP — main layout: two-page notebook spread
   Left page: day rows
   Right page: journal + todo card + habits
   ======================================== */
import React, { useState, useCallback, useEffect } from "react";
import {
  initStore,
  saveStore,
  getWeek,
  currentWeekStart,
  todayStr,
} from "./store";
import { useAutoSave } from "./hooks/useAutoSave";
import Header from "./components/Header";
import DayRow from "./components/DayRow";
import JournalPanel from "./components/JournalPanel";
import TodoCard from "./components/TodoCard";
import HabitAreas from "./components/HabitAreas";
import StickerTray from "./components/StickerTray";
import StickerLayer from "./components/StickerLayer";

/* ── Static decorative doodles (SVG, pointer-events: none) ────── */
function Doodles() {
  return (
    <>
      {/* Green sparkle star — top right of right page */}
      <svg className="absolute no-interact" style={{ top: "8%", right: "5%", opacity: 0.35 }} width="28" height="28" viewBox="0 0 24 24" fill="#b8c9a3">
        <path d="M12 0 L14 8 L22 8 L16 13 L18 21 L12 16 L6 21 L8 13 L2 8 L10 8 Z" />
      </svg>

      {/* Cat face — mid right page */}
      <svg className="absolute no-interact" style={{ top: "35%", right: "8%", opacity: 0.25 }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.2" strokeLinecap="round">
        <path d="M5 3 L3 10 Q3 14 7 16 L7 20 L10 18 L14 18 L17 20 L17 16 Q21 14 21 10 L19 3" />
        <circle cx="9" cy="11" r="1" fill="#8a7a6a" />
        <circle cx="15" cy="11" r="1" fill="#8a7a6a" />
        <path d="M11 13 Q12 14 13 13" />
      </svg>

      {/* Coffee cup — bottom left of right page */}
      <svg className="absolute no-interact" style={{ bottom: "22%", left: "3%", opacity: 0.25 }} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.2" strokeLinecap="round">
        <path d="M5 9 h12 v8 Q17 21 12 21 Q7 21 7 17 Z" fill="rgba(240,223,160,0.3)" />
        <path d="M17 11 Q21 11 21 14 Q21 17 17 17" />
        <path d="M8 6 Q8 4 10 3" strokeDasharray="2 1" />
        <path d="M12 6 Q12 4 14 3" strokeDasharray="2 1" />
      </svg>

      {/* Spider-hero silhouette — bottom right of right page (original design, not copyrighted) */}
      <svg className="absolute no-interact" style={{ bottom: "8%", right: "4%", opacity: 0.2 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6a5a4a" strokeWidth="1" strokeLinecap="round">
        <circle cx="12" cy="10" r="4.5" fill="rgba(106,90,74,0.3)" />
        <circle cx="10" cy="9" r="0.8" fill="white" opacity="0.6" />
        <circle cx="14" cy="9" r="0.8" fill="white" opacity="0.6" />
        {/* legs */}
        <path d="M7.5 8 Q4 6 2 3" />
        <path d="M8 7 Q5 4 5 1" />
        <path d="M16.5 8 Q20 6 22 3" />
        <path d="M16 7 Q19 4 19 1" />
        <path d="M7.5 12 Q4 14 2 14" />
        <path d="M8 13 Q5 16 4 18" />
        <path d="M16.5 12 Q20 14 22 14" />
        <path d="M16 13 Q19 16 20 18" />
        {/* web line going up */}
        <path d="M12 5.5 L12 1" strokeDasharray="1 2" opacity="0.4" />
      </svg>

      {/* Small sparkle — near habit areas */}
      <svg className="absolute no-interact" style={{ bottom: "5%", left: "45%", opacity: 0.3 }} width="16" height="16" viewBox="0 0 24 24" fill="#f0dfa0">
        <path d="M12 2 L13 9 L20 9 L14.5 13 L16.5 20 L12 15.5 L7.5 20 L9.5 13 L4 9 L11 9 Z" />
      </svg>
    </>
  );
}

/* ── Main App ──────────────────────────────── */
export default function App() {
  // Initialize data store — start on seed week if fresh, else current week
  const [initialStore] = useState(() => initStore());
  const [store, setStore] = useState(initialStore);
  const [weekStart, setWeekStart] = useState(() => {
    const keys = Object.keys(initialStore.weeks);
    return keys.length > 0 ? keys[keys.length - 1] : currentWeekStart();
  });
  const today = todayStr();

  // Theme state — persists to localStorage, respects system preference
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("planner-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("planner-theme", dark ? "dark" : "light");
  }, [dark]);

  // Initialize selected day to today if in current week, else 0
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const wd = initialStore.weeks[Object.keys(initialStore.weeks).pop()];
    if (!wd || !wd.days) return 0;
    const idx = wd.days.findIndex((d) => d.date === today);
    return idx >= 0 ? idx : 0;
  });

  // Auto-advance to today at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = todayStr();
      if (now !== today) {
        const newWeek = currentWeekStart();
        setWeekStart((prev) => {
          if (prev !== newWeek) return newWeek;
          return prev;
        });
        const wd = getWeek(store, newWeek);
        const todayIdx = wd.days.findIndex((d) => d.date === now);
        setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [today, store]);

  // Auto-save entire store to localStorage
  useAutoSave(store, saveStore, 400);

  const weekData = getWeek(store, weekStart);

  const updateDay = useCallback(
    (dayIndex, newDay) => {
      setStore((prev) => {
        const wd = prev.weeks[weekStart];
        if (!wd) return prev;
        const newDays = [...wd.days];
        newDays[dayIndex] = newDay;
        return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...wd, days: newDays } } };
      });
    },
    [weekStart]
  );

  const updateTodoCard = useCallback(
    (newTodoCard) => {
      setStore((prev) => ({ ...prev, todoCard: newTodoCard }));
    },
    []
  );

  const updateHabits = useCallback(
    (newHabits) => {
      setStore((prev) => ({ ...prev, habits: newHabits }));
    },
    []
  );

  const updateWater = useCallback(
    (dateKey, liters) => {
      setStore((prev) => ({
        ...prev,
        waterTrack: { ...prev.waterTrack, [dateKey]: liters },
      }));
    },
    []
  );

  const updatePlacedStickers = useCallback(
    (newPlaced) => {
      setStore((prev) => ({ ...prev, placedStickers: newPlaced }));
    },
    []
  );

  const updateCustomStickers = useCallback(
    (newCustom) => {
      setStore((prev) => ({ ...prev, customStickers: newCustom }));
    },
    []
  );

  const clearWeekStickers = useCallback(() => {
    setStore((prev) => ({ ...prev, placedStickers: [] }));
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center relative" style={{ background: "var(--bg)" }}>
      {/* ── Outer tabs (decorative, non-interactive) ──── */}
      {/* Left edge: "2026" tab */}
      <div
        className="absolute no-interact"
        style={{
          left: 0,
          top: "30%",
          transform: "translateY(-50%) rotate(-90deg)",
          transformOrigin: "center",
          background: "var(--tab-2026-bg)",
          padding: "4px 14px",
          borderRadius: "0 0 8px 8px",
          fontSize: "14px",
          fontFamily: "var(--font-hand)",
          fontWeight: 700,
          color: "white",
          letterSpacing: "2px",
          pointerEvents: "none",
        }}
      >
        2026
      </div>

      {/* Left edge: current date tab */}
      <div
        className="absolute no-interact"
        style={{
          left: 0,
          top: "45%",
          transform: "translateY(-50%) rotate(-90deg)",
          transformOrigin: "center",
          background: "var(--tab-date-bg)",
          padding: "3px 10px",
          borderRadius: "0 0 6px 6px",
          fontSize: "11px",
          fontFamily: "var(--font-hand)",
          color: "white",
          letterSpacing: "1px",
          pointerEvents: "none",
        }}
      >
        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>

      {/* Right edge: 3 stacked dot tabs */}
      <div
        className="absolute flex flex-col gap-1.5 no-interact"
        style={{
          right: 0,
          top: "30%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#e8a87c" }} />
        <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#7ca5c9" }} />
        <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#8cb88c" }} />
      </div>

      {/* ── Two-page notebook spread ──── */}
      <div className="relative" style={{ width: "calc(100vw - 80px)", height: "calc(100vh - 40px)", maxWidth: 1400 }}>
        <div
          className="grid grid-cols-2 h-full w-full"
          style={{ gap: 0 }}
        >
          {/* ── LEFT PAGE ──── */}
          <div
            className="relative flex flex-col overflow-hidden page-shadow-left"
            style={{
              background: "var(--page)",
              borderRadius: "12px 0 0 12px",
              borderRight: "1px solid var(--page-border)",
              transition: "background-color 0.3s ease, border-color 0.3s ease",
            }}
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-1">
              <Header weekStart={weekStart} onNavigate={setWeekStart} dark={dark} onToggleDark={() => setDark(!dark)} />
            </div>

            {/* Day rows */}
            <div className="flex-1 flex flex-col px-2 pb-2 overflow-hidden no-scrollbar">
              {weekData.days.map((day, idx) => (
                <DayRow
                  key={day.date}
                  day={day}
                  index={idx}
                  isToday={day.date === today}
                  isSelected={idx === selectedDayIndex}
                  onSelect={() => setSelectedDayIndex(idx)}
                  onDayUpdate={(newDay) => updateDay(idx, newDay)}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT PAGE ──── */}
          <div
            className="relative flex flex-col overflow-hidden dot-grid-bg page-shadow-right"
            style={{
              background: "var(--page)",
              borderRadius: "0 12px 12px 0",
              transition: "background-color 0.3s ease",
            }}
          >
            {/* Decorative doodles */}
            <Doodles />

            {/* Top ~55%: Journal + Todo card */}
            <div className="flex flex-row flex-[0.55] min-h-0 gap-3 px-4 pt-3 pb-1">
              {/* Journal */}
              <div className="flex-1 min-w-0">
                <JournalPanel
                  key={weekData.days[selectedDayIndex]?.date}
                  day={weekData.days[selectedDayIndex]}
                  onDayUpdate={(newDay) => updateDay(selectedDayIndex, newDay)}
                />
              </div>

              {/* Todo card */}
              <div className="w-[42%] shrink-0">
                <TodoCard data={store.todoCard} onUpdate={updateTodoCard} />
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 no-interact" style={{ borderTop: "1px dashed var(--border)", pointerEvents: "none" }} />

            {/* Bottom ~40%: Habit areas */}
            <div className="flex-[0.42] min-h-0 px-4 pt-2 pb-3 overflow-hidden">
              <HabitAreas
                habits={store.habits}
                waterTrack={store.waterTrack}
                weekStart={weekStart}
                onHabitsChange={updateHabits}
                onWaterChange={updateWater}
              />
            </div>
          </div>
        </div>

        {/* ── Sticker layer (above both pages, absolute to this container) ──── */}
        <StickerLayer
          placedStickers={store.placedStickers}
          onPlacedChange={updatePlacedStickers}
          customStickers={store.customStickers}
        />
      </div>

      {/* ── Sticker tray ──── */}
      <StickerTray
        customStickers={store.customStickers}
        onCustomStickersChange={updateCustomStickers}
      />

      {/* Clear stickers button */}
      {store.placedStickers.length > 0 && (
        <button
          onClick={clearWeekStickers}
          className="fixed bottom-16 right-16 z-50 font-hand text-sm py-1 px-3 rounded-md"
          style={{
            background: "var(--clear-btn-bg)",
            border: "1px solid var(--tray-border)",
            color: "#c97b7b",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          clear stickers
        </button>
      )}
    </div>
  );
}
