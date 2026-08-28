/* ========================================
   EDITABLE TEXT — inline editable single-line text
   ======================================== */
import React, { useRef, useState } from "react";

export default function EditableText({
  value,
  onChange,
  className = "",
  placeholder = "click to edit...",
  style = {},
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-edit ${className}`}
        style={{ ...style, background: "var(--input-hover-bg)" }}
        autoFocus
      />
    );
  }

  return (
    <span
      className={`inline-edit ${className}`}
      style={style}
      onClick={() => {
        setDraft(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }}
      title="Click to edit"
    >
      {value || <span style={{ opacity: 0.35 }}>{placeholder}</span>}
    </span>
  );
}
