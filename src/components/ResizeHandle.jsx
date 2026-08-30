/* ========================================
   RESIZE HANDLE — draggable divider between sections
   Supports horizontal (top/bottom) and vertical (left/right) resizing.
   ======================================== */
import React from "react";

export default function ResizeHandle({ direction = "horizontal", onResize }) {
  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = (e.touches ? e.touches[0].clientX : e.clientX);
    const startY = (e.touches ? e.touches[0].clientY : e.clientY);
    const parent = e.currentTarget.parentElement;
    const rect = parent.getBoundingClientRect();

    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;

      if (direction === "horizontal") {
        const dy = cy - startY;
        const pct = ((rect.height + dy) / rect.height) * 100;
        onResize(Math.max(20, Math.min(80, pct)));
      } else {
        const dx = cx - startX;
        const pct = ((rect.width + dx) / rect.width) * 100;
        onResize(Math.max(25, Math.min(75, pct)));
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.body.style.cursor = direction === "horizontal" ? "ns-resize" : "ew-resize";
    document.body.style.userSelect = "none";
  };

  const isH = direction === "horizontal";

  return (
    <div
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        position: "relative",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isH ? "ns-resize" : "ew-resize",
        userSelect: "none",
        touchAction: "none",
        flexShrink: 0,
      }}
    >
      <div
        className="resize-handle-bar"
        style={{
          background: "var(--border)",
          borderRadius: 2,
          transition: "background 0.15s ease, transform 0.15s ease",
          ...(isH ? { width: "100%", height: 3 } : { width: 3, height: "100%" }),
        }}
      />
      <style>{`
        .resize-handle-bar:hover {
          background: var(--color-dusty-blue) !important;
          transform: ${isH ? "scaleY(1.5)" : "scaleX(1.5)"};
        }
      `}</style>
    </div>
  );
}
