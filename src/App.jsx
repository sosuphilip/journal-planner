/* ========================================
   APP — main layout: two-page notebook spread
   Left page: day rows
   Right page: journal + todo card + habits
   ======================================== */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import {
  loadCloudStore,
  loadCachedCloudStore,
  saveWeek,
  saveSettings,
} from "./lib/cloudStore";
import {
  initStore,
  getWeek,
  currentWeekStart,
  todayStr,
  uid,
} from "./store";
import Auth from "./components/Auth";
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

      {/* Spider-hero silhouette — bottom right of right page */}
      <svg className="absolute no-interact" style={{ bottom: "8%", right: "4%", opacity: 0.2 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6a5a4a" strokeWidth="1" strokeLinecap="round">
        <circle cx="12" cy="10" r="4.5" fill="rgba(106,90,74,0.3)" />
        <circle cx="10" cy="9" r="0.8" fill="white" opacity="0.6" />
        <circle cx="14" cy="9" r="0.8" fill="white" opacity="0.6" />
        <path d="M7.5 8 Q4 6 2 3" />
        <path d="M8 7 Q5 4 5 1" />
        <path d="M16.5 8 Q20 6 22 3" />
        <path d="M16 7 Q19 4 19 1" />
        <path d="M7.5 12 Q4 14 2 14" />
        <path d="M8 13 Q5 16 4 18" />
        <path d="M16.5 12 Q20 14 22 14" />
        <path d="M16 13 Q19 16 20 18" />
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
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data store
  const [store, setStore] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const today = todayStr();
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; });
  const rightPageRef = useRef(null);

  // Theme state — persists to localStorage, respects system preference
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("planner-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("planner-theme", dark ? "dark" : "light");
    // Update theme-color meta tag for PWA status bar
    const meta = document.getElementById("theme-color");
    if (meta) meta.content = dark ? "#1c1815" : "#e8e2d6";

    // Update color-scheme for browser UI (scrollbars, form controls)
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    // Force full browser repaint via double rAF
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.offsetHeight;
      });
    });
  }, [dark]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    // Check initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setAuthLoading(false);
      });

    // Safety net — if neither fires (e.g. failed redirect), don't leave the user stuck
    const fallbackTimer = setTimeout(() => setAuthLoading(false), 5000);

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Load data — instant from cache, then refresh from cloud in background
  useEffect(() => {
    if (!user) {
      setStore(null);
      setDataLoading(false);
      return;
    }

    // 1. Load instantly from localStorage cache (no loading screen)
    const cached = loadCachedCloudStore(user.id);
    if (cached) {
      setStore(cached);
      setDataLoading(false);
    } else {
      // No cache yet — show loading only if we must
      setDataLoading(true);
    }

    // 2. Fetch fresh data from Supabase in background
    loadCloudStore(user.id)
      .then((cloudData) => {
        if (Object.keys(cloudData.weeks).length === 0) {
          const defaultStore = initStore();
          for (const [weekKey, weekData] of Object.entries(defaultStore.weeks)) {
            saveWeek(user.id, weekKey, weekData);
          }
          saveSettings(user.id, defaultStore);
          setStore(defaultStore);
        } else {
          setStore(cloudData);
        }
        setDataLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cloud data:", err);
        if (!cached) {
          setStore(initStore());
          setDataLoading(false);
        }
        // If we had cache, keep using it — don't overwrite with error
      });
  }, [user]);

  // Mobile view toggle: "days" or "journal"
  const [mobileView, setMobileView] = useState("days");
  const [isMobileLandscape, setIsMobileLandscape] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth > window.innerHeight && window.innerHeight <= 500;
  });

  // Update on resize/orientation change
  useEffect(() => {
    const check = () => {
      setIsMobileLandscape(window.innerWidth > window.innerHeight && window.innerHeight <= 500);
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Initialize selected day to today if in current week, else 0 (only on first load)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const initializedDayRef = useRef(false);
  useEffect(() => {
    if (!store || initializedDayRef.current) return;
    const wd = store.weeks[weekStart];
    if (!wd || !wd.days) {
      setSelectedDayIndex(0);
      initializedDayRef.current = true;
      return;
    }
    const idx = wd.days.findIndex((d) => d.date === today);
    setSelectedDayIndex(idx >= 0 ? idx : 0);
    initializedDayRef.current = true;
  }, [store, weekStart, today]);

  // Auto-advance to today at midnight
  useEffect(() => {
    if (!store) return;
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

  // Debounced cloud save
  const saveTimerRef = useRef(null);
  const debouncedCloudSave = useCallback(
    (newStore) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (!user) return;
        const currentWeekData = newStore.weeks[weekStart];
        if (currentWeekData) saveWeek(user.id, weekStart, currentWeekData);
        saveSettings(user.id, newStore);
      }, 500);
    },
    [user, weekStart]
  );

  // Auto-save to Supabase whenever store changes
  useEffect(() => {
    if (store && user) {
      debouncedCloudSave(store);
    }
  }, [store, user, debouncedCloudSave]);

  const weekData = store ? getWeek(store, weekStart) : null;

  const updateDay = useCallback(
    (dayIndex, newDay) => {
      setStore((prev) => {
        if (!prev) return prev;
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
      setStore((prev) => {
        if (!prev) return prev;
        const wd = prev.weeks[weekStart];
        if (!wd) return prev;
        const newDays = [...wd.days];
        newDays[selectedDayIndex] = { ...newDays[selectedDayIndex], todoCard: newTodoCard };
        return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...wd, days: newDays } } };
      });
    },
    [weekStart, selectedDayIndex]
  );

  const updateHabits = useCallback(
    (newHabits) => {
      setStore((prev) => {
        if (!prev) return prev;
        const wd = prev.weeks[weekStart];
        if (!wd) return prev;
        return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...wd, habits: newHabits } } };
      });
    },
    [weekStart]
  );

  const updateWater = useCallback(
    (dateKey, liters) => {
      setStore((prev) =>
        prev
          ? { ...prev, waterTrack: { ...prev.waterTrack, [dateKey]: liters } }
          : prev
      );
    },
    []
  );

  const updatePlacedStickers = useCallback(
    (newPlaced) => {
      setStore((prev) => {
        if (!prev) return prev;
        const wd = prev.weeks[weekStart];
        if (!wd) return prev;
        const newDays = [...wd.days];
        newDays[selectedDayIndex] = { ...newDays[selectedDayIndex], placedStickers: newPlaced };
        return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...wd, days: newDays } } };
      });
    },
    [weekStart, selectedDayIndex]
  );

  const updateCustomStickers = useCallback(
    (newCustom) => {
      setStore((prev) => (prev ? { ...prev, customStickers: newCustom } : prev));
    },
    []
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStore(null);
  };

  // Show auth screen if not logged in
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <span className="font-hand text-lg" style={{ color: "var(--text-muted)" }}>Loading...</span>
        <button
          onClick={() => window.location.reload()}
          className="font-hand text-sm underline cursor-pointer bg-transparent border-none"
          style={{ color: "var(--color-accent-blue)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Show loading while data loads
  if (dataLoading || !store) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <span className="font-hand text-lg" style={{ color: "var(--text-muted)" }}>Loading your journal...</span>
      </div>
    );
  }

  return (
    <div className="app-shell w-screen h-screen overflow-hidden relative" style={{ background: "var(--bg)" }}>
      {/* Sign out button */}
      <button
        onClick={handleSignOut}
        className="sign-out-btn fixed z-50 font-hand text-sm py-1 px-3 rounded-md cursor-pointer"
        style={{
          background: "var(--clear-btn-bg)",
          border: "1px solid var(--tray-border)",
          color: "var(--text-faint)",
          pointerEvents: "auto",
        }}
      >
        sign out
      </button>

      {/* ── Two-page notebook spread ──── */}
      <div className="relative" style={{ width: '100%', height: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ── Decorative tabs (pinned to notebook edges, overflow visible) ──── */}
        <div className="notebook-tabs">
          {/* Right-side tabs — hang off the right edge into background */}
          <div
            className="absolute no-interact"
            style={{
              right: -48,
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

          <div
            className="absolute no-interact"
            style={{
              right: -40,
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

          {/* Right squares — hang off the right edge, below the text tabs */}
          <div
            className="absolute flex flex-col gap-1.5 no-interact"
            style={{
              right: -14,
              top: "58%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#e8a87c" }} />
            <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#7ca5c9" }} />
            <div style={{ width: 12, height: 12, borderRadius: "0 4px 4px 0", background: "#8cb88c" }} />
          </div>
        </div>

        {/* Notebook pages (overflow:hidden for scroll) */}
        <div className="notebook-spread">
          <div className="notebook-grid h-full w-full">
          {/* ── LEFT PAGE ──── */}
          <div
            className={`relative flex flex-col page-shadow-left ${mobileView !== "days" ? "mobile-hidden" : ""}`}
            style={{
              background: "var(--page)",
              borderRadius: "12px 0 0 12px",
              borderRight: "1px solid var(--page-border)",
              transition: "background-color 0.3s ease, border-color 0.3s ease",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div className="px-2 pt-1.5 pb-0.5 md:px-4 md:pt-3 md:pb-1">
              <Header weekStart={weekStart} onNavigate={setWeekStart} dark={dark} onToggleDark={() => setDark(!dark)} />
            </div>

            <div className="flex-1 flex flex-col px-1 md:px-2 pb-1 md:pb-2 overflow-y-auto no-scrollbar">
              {weekData.days.map((day, idx) => (
                <DayRow
                  key={day.date}
                  day={day}
                  index={idx}
                  isToday={day.date === today}
                  isSelected={idx === selectedDayIndex}
                  onSelect={() => {
                    setSelectedDayIndex(idx);
                    // On mobile, auto-switch to journal when tapping a day
                    if (window.innerWidth <= 768) setMobileView("journal");
                  }}
                  onDayUpdate={(newDay) => updateDay(idx, newDay)}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT PAGE ──── */}
          <div
            className={`relative flex flex-col dot-grid-bg page-shadow-right ${mobileView !== "journal" ? "mobile-hidden" : ""}`}
            style={{
              background: "var(--page)",
              borderRadius: "0 12px 12px 0",
              transition: "background-color 0.3s ease",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Doodles />

            <div ref={rightPageRef} className="flex-1 min-h-0 relative no-scrollbar" style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex flex-col gap-1 px-3 pt-2 pb-0.5 md:flex-row md:gap-3 md:px-4 md:pt-3">
                <div className="flex-1 min-w-0">
                  <JournalPanel
                    key={weekData.days[selectedDayIndex]?.date}
                    day={weekData.days[selectedDayIndex]}
                    onDayUpdate={(newDay) => updateDay(selectedDayIndex, newDay)}
                  />
                </div>

                <div className="w-full md:w-[42%] shrink-0">
                  <TodoCard data={weekData.days[selectedDayIndex]?.todoCard || { title: 'todo list', items: [] }} onUpdate={updateTodoCard} />
                </div>
              </div>

              <div className="mx-3 md:mx-4 no-interact" style={{ borderTop: "1px dashed var(--border)", pointerEvents: "none" }} />

              <div className="px-3 md:px-4 pt-1 md:pt-2 pb-1 md:pb-3">
                <HabitAreas
                  habits={weekData.habits || []}
                  waterTrack={store.waterTrack}
                  weekStart={weekStart}
                  onHabitsChange={updateHabits}
                  onWaterChange={updateWater}
                />
              </div>

              <StickerLayer
                placedStickers={weekData.days[selectedDayIndex]?.placedStickers || []}
                onPlacedChange={updatePlacedStickers}
                customStickers={store.customStickers}
                containerRef={rightPageRef}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Mobile bottom nav (only visible on small screens) ──── */}
      <div className="mobile-nav">
        <button
          onClick={() => setMobileView("days")}
          className={`mobile-nav-btn ${mobileView === "days" ? "active" : ""}`}
        >
          <span className="text-lg">📋</span>
          <span>Days</span>
        </button>
        <button
          onClick={() => setMobileView("journal")}
          className={`mobile-nav-btn ${mobileView === "journal" ? "active" : ""}`}
        >
          <span className="text-lg">📓</span>
          <span>Journal</span>
        </button>
      </div>

      <StickerTray
        customStickers={store.customStickers}
        onCustomStickersChange={updateCustomStickers}
        onStickerTapPlace={(stickerType, isCustom) => {
          const wd = store.weeks[weekStart];
          const day = wd?.days[selectedDayIndex];
          if (!day) return;
          const newSticker = {
            id: uid(),
            stickerType,
            isCustom: isCustom || false,
            xP: 40,
            yP: 30,
            width: 50,
            height: 50,
            rotation: 0,
          };
          updatePlacedStickers([...(day.placedStickers || []), newSticker]);
        }}
      />

    </div>
  );
}
