/* ========================================
   CHECKLIST — reusable editable checklist
   Used in DayRow and TodoCard.
   ======================================== */
import React, { useState } from "react";
import { uid } from "../store";
import EditableText from "./EditableText";

function CheckIcon({ checked }) {
  if (checked) {
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
        <rect x="1" y="1" width="18" height="18" rx="3" stroke="#8a7a6a" strokeWidth="1.5" fill="rgba(184,201,163,0.3)" />
        <polyline points="5 10 9 14 15 6" stroke="#6b8a5e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
      <rect x="1" y="1" width="18" height="18" rx="3" stroke="#c5b9a8" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function Checklist({ items = [], onChange, showCheckboxes = true, className = "" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [animatingIdx, setAnimatingIdx] = useState(null);

  const toggleItem = (idx) => {
    setAnimatingIdx(idx);
    setTimeout(() => setAnimatingIdx(null), 200);
    const next = items.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    );
    onChange(next);
  };

  const updateText = (idx, text) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, text } : item
    );
    onChange(next);
  };

  const deleteItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    onChange([...items, { id: uid(), text: "", checked: false }]);
  };

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-start gap-1.5 group"
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {showCheckboxes && !item.isNote && (
            <button
              onClick={() => toggleItem(idx)}
              className="cursor-pointer bg-transparent border-none p-0 flex-shrink-0"
              style={{ pointerEvents: "auto" }}
              aria-label={item.checked ? "Uncheck" : "Check"}
            >
              <span className={animatingIdx === idx ? "check-anim" : ""}>
                <CheckIcon checked={item.checked} />
              </span>
            </button>
          )}
          {!showCheckboxes || item.isNote ? (
            <span className="w-4 shrink-0" />
          ) : null}
          <EditableText
            value={item.text}
            onChange={(text) => updateText(idx, text)}
            className={`flex-1 text-base leading-tight ${
              item.checked && !item.isNote ? "check-item-checked" : ""
            }`}
            placeholder="new item..."
          />
          {hoveredIdx === idx && (
            <button
              onClick={() => deleteItem(idx)}
              style={{ color: 'var(--color-muted-pink)', pointerEvents: "auto", opacity: hoveredIdx === idx ? 0.6 : 0 }}
              aria-label="Delete item"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={(e) => { e.stopPropagation(); addItem(); }}
        className="text-sm mt-1 bg-transparent border-none cursor-pointer text-left transition-colors"
        style={{ pointerEvents: "auto", color: "var(--text-muted)" }}
      >
        + add item
      </button>
    </div>
  );
}
