/* ========================================
   DAY ROW — single day's row in the left page
   Big date numeral, day label, checklist.
   Friday: two-column layout.
   Saturday: star sticker + special note.
   ======================================== */
import React from "react";
import Checklist from "./Checklist";
import EditableText from "./EditableText";

const BUILT_IN_STICKERS = {
  star: (size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f0dfa0" stroke="#c9b06b" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export default function DayRow({ day, index, isToday, isSelected, onSelect, onDayUpdate }) {
  const { date, dayLabel, checklistItems, specialNote, dateCircled, dateSticker } = day;
  const dayNum = new Date(date + "T00:00:00").getDate();
  const isFri = dayLabel === "Fri";
  const isSat = dayLabel === "Sat";
  const isSun = dayLabel === "Sun";

  // Split Friday items: notes (isNote) vs checkboxes
  const friNotes = isFri ? checklistItems.filter((i) => i.isNote) : [];
  const friChecks = isFri ? checklistItems.filter((i) => !i.isNote) : [];

  const handleItemsChange = (newItems) => {
    onDayUpdate({ ...day, checklistItems: newItems });
  };

  const handleSpecialNote = (text) => {
    onDayUpdate({ ...day, specialNote: text });
  };

  const todayBg = isToday ? "var(--today-bg)" : "transparent";
  const selectedBg = isSelected ? "var(--selected-bg)" : todayBg;

  return (
    <div
      className="day-row flex items-start gap-3 py-1.5 px-2 relative group cursor-pointer"
      style={{
        background: selectedBg,
        borderBottom: index < 6 ? "1px dashed rgba(197,185,168,0.4)" : "none",
        minHeight: isFri ? "auto" : "2.2rem",
      }}
      onClick={onSelect}
    >
      {/* Date numeral + day label */}
      <div className="flex items-center gap-1.5 shrink-0 w-14 relative" style={{ pointerEvents: "none", color: "var(--text)" }}>
        {/* Selected indicator */}
        {isSelected && (
          <span className="day-dot-enter absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "#b8c9a3" }} />
        )}
        {/* Date sticker next to numeral */}
        {dateSticker && BUILT_IN_STICKERS[dateSticker] && (
          <span className="absolute -left-1 -top-1">
            {BUILT_IN_STICKERS[dateSticker](16)}
          </span>
        )}
        <span
          className={`font-hand text-2xl font-bold leading-none ${
            dateCircled
              ? "text-muted-red"
              : isToday
              ? "text-dusty-blue"
              : "text-gray-700"
          }`}
          style={{
            ...(dateCircled
              ? {
                  border: "2px solid #c97b7b",
                  borderRadius: "50%",
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                }
              : {}),
          }}
        >
          {dayNum}
        </span>
        <span className="font-hand text-base uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          {dayLabel}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {isFri ? (
          /* Friday: two-column layout */
          <div className="flex gap-4">
            {/* Left column: plain notes (no checkboxes) */}
            <div className="flex-1">
              <Checklist
                items={friNotes}
                onChange={(newItems) => {
                  handleItemsChange([...newItems, ...friChecks]);
                }}
                showCheckboxes={false}
                className="text-base"
              />
            </div>
            {/* Right column: checkboxes */}
            <div className="flex-1">
              <Checklist
                items={friChecks}
                onChange={(newItems) => {
                  handleItemsChange([...friNotes, ...newItems]);
                }}
                showCheckboxes={true}
                className="text-base"
              />
            </div>
          </div>
        ) : isSat ? (
          /* Saturday: star sticker shown, special note text (editable inline) */
          <div className="flex items-start gap-2">
            {dateSticker && BUILT_IN_STICKERS[dateSticker] && (
              <span className="mt-0.5" style={{ pointerEvents: "none" }}>
                {BUILT_IN_STICKERS[dateSticker](20)}
              </span>
            )}
            <EditableText
              value={specialNote}
              onChange={handleSpecialNote}
              className="font-hand text-base italic flex-1"
              style={{ color: "var(--text-muted)" }}
              placeholder="click to add note..."
            />
          </div>
        ) : isSun ? (
          /* Sunday: empty */
          <div className="text-base italic font-hand" style={{ pointerEvents: "none", color: "var(--text-faint)" }}>
            —
          </div>
        ) : (
          /* Normal day: checklist */
          <Checklist
            items={checklistItems}
            onChange={handleItemsChange}
            showCheckboxes={true}
            className="text-base"
          />
        )}
      </div>
    </div>
  );
}
