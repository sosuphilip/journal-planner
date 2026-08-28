/* ========================================
   JOURNAL PANEL — right page top area
   Free-text journal, mood/calorie line,
   robot-headphones doodle + music note text.
   ======================================== */
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function JournalPanel({ day, onDayUpdate }) {
  // Local state initialized from day prop; component remounts via `key` on day change
  const [journalText, setJournalText] = useState(day.journalText || "");
  const [moodText, setMoodText] = useState(day.journalMood || "");
  const [line1, setLine1] = useState(day.musicNote?.line1 || "");
  const [line2, setLine2] = useState(day.musicNote?.line2 || "");
  const timerRef = useRef(null);
  const dayRef = useRef(day);
  useEffect(() => { dayRef.current = day; });

  // Debounced save using refs to avoid stale closures
  const debouncedSave = useCallback((field, value) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const d = dayRef.current;
      onDayUpdate({ ...d, [field]: value });
    }, 400);
  }, [onDayUpdate]);

  const debouncedMusicSave = useCallback((field, value) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const d = dayRef.current;
      onDayUpdate({ ...d, musicNote: { ...(d.musicNote || {}), [field]: value } });
    }, 400);
  }, [onDayUpdate]);

  const handleJournalChange = (e) => {
    const val = e.target.value;
    setJournalText(val);
    debouncedSave("journalText", val);
  };

  const handleMoodChange = (e) => {
    const val = e.target.value;
    setMoodText(val);
    debouncedSave("journalMood", val);
  };

  const handleLine1Change = (e) => {
    setLine1(e.target.value);
    debouncedMusicSave("line1", e.target.value);
  };

  const handleLine2Change = (e) => {
    setLine2(e.target.value);
    debouncedMusicSave("line2", e.target.value);
  };

  return (
    <div className="flex flex-col h-full relative" style={{ pointerEvents: "auto" }}>
      {/* Journal header */}
      <div className="flex items-center gap-2 mb-1" style={{ pointerEvents: "none" }}>
        <span className="font-hand text-base font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
          journal
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#b8c9a3" opacity="0.6">
          <path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
        </svg>
      </div>

      {/* Journal textarea */}
      <textarea
        value={journalText}
        onChange={handleJournalChange}
        className="flex-1 font-hand text-base leading-relaxed p-2 w-full"
        style={{
          color: "var(--text)",
          lineHeight: "1.6",
          minHeight: 0,
          background: "var(--journal-bg)",
          borderRadius: "6px",
          border: "1px solid var(--journal-border)",
          transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
        }}
        placeholder="Write about your day..."
      />

      {/* Mood / calorie line */}
      <div className="mt-1.5 flex items-center gap-1">
        <span className="font-hand text-sm" style={{ color: "#6a9ec0" }}>✦</span>
        <input
          type="text"
          value={moodText}
          onChange={handleMoodChange}
          className="font-hand text-sm flex-1"
          style={{ color: "#6a9ec0", fontStyle: "italic" }}
          placeholder="mood or calorie note..."
        />
      </div>

      {/* Music note section */}
      <div className="mt-2 flex items-start gap-2 p-1.5 rounded-md" style={{ background: "var(--music-bg)" }}>
        {/* Robot headphones doodle */}
        <div className="shrink-0 mt-0.5" style={{ pointerEvents: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <rect x="1" y="15" width="4" height="6" rx="1" fill="#c5d8e6" stroke="#8a7a6a" />
            <rect x="19" y="15" width="4" height="6" rx="1" fill="#c5d8e6" stroke="#8a7a6a" />
            <circle cx="3" cy="12" r="1" fill="#8a7a6a" />
            <circle cx="21" cy="12" r="1" fill="#8a7a6a" />
            <path d="M8 3 Q12 0 16 3" stroke="#8a7a6a" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        <div className="flex flex-col gap-0 min-w-0 flex-1" style={{ pointerEvents: "auto", color: "var(--text-muted)" }}>
          <input
            type="text"
            value={line1}
            onChange={handleLine1Change}
            className="font-hand text-sm w-full"
            style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}
            placeholder="listened to..."
          />
          <input
            type="text"
            value={line2}
            onChange={handleLine2Change}
            className="font-hand text-sm w-full"
            style={{ color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis" }}
            placeholder="playlist..."
          />
        </div>
        <span className="text-lg" style={{ pointerEvents: "none", color: "#b8c9a3" }}>♪</span>
      </div>
    </div>
  );
}
