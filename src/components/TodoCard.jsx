/* ========================================
   TODO CARD — editable todo list card
   Lives on the right page, top-right area.
   ======================================== */
import React from "react";
import EditableText from "./EditableText";
import Checklist from "./Checklist";

export default function TodoCard({ data, onUpdate }) {
  const { title, items } = data;

  const handleTitleChange = (newTitle) => {
    onUpdate({ ...data, title: newTitle });
  };

  const handleItemsChange = (newItems) => {
    onUpdate({ ...data, items: newItems });
  };

  return (
    <div
      className="rounded-lg p-3 relative transition-shadow duration-200"
      style={{
        background: "var(--card-bg)",
        border: "1.5px dashed var(--card-border)",
        minHeight: "auto",
        boxShadow: "0 1px 3px var(--shadow)",
        transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px var(--shadow)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 3px var(--shadow)"}
    >
      {/* Card title */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-pink text-base" style={{ pointerEvents: "none" }}>✿</span>
        <EditableText
          value={title}
          onChange={handleTitleChange}
          className="font-hand text-base font-bold"
          style={{ color: "var(--color-muted-red)" }}
          placeholder="card title..."
        />
      </div>

      {/* Checklist */}
      <Checklist
        items={items}
        onChange={handleItemsChange}
        showCheckboxes={true}
        className="text-sm"
      />
    </div>
  );
}
