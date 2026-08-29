/* ========================================
   STICKER LAYER — rendered above page content
   Handles placement, drag, resize, rotate, delete.
   Supports both mouse and touch interactions.
   ======================================== */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { uid } from "../store";
import { BUILTIN_STICKERS } from "./StickerTray";

// Helper: extract client coordinates from mouse or touch event
function clientXY(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

export default function StickerLayer({ placedStickers, onPlacedChange, customStickers }) {
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef({});
  const stickersRef = useRef(placedStickers);
  useEffect(() => {
    stickersRef.current = placedStickers;
  }, [placedStickers]);

  const getStickerContent = (sticker) => {
    if (sticker.isCustom) {
      const custom = customStickers.find((cs) => cs.id === sticker.stickerType);
      if (custom) {
        return (
          <img
            src={custom.imageDataUrl}
            alt={custom.name}
            className="w-full h-full object-contain"
            draggable={false}
          />
        );
      }
      return null;
    }
    const svg = BUILTIN_STICKERS[sticker.stickerType];
    if (!svg) return null;
    return <div className="w-full h-full">{svg}</div>;
  };

  // ── Move sticker (mouse + touch) ──
  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const { x: cx, y: cy } = clientXY(e);
    const sticker = stickersRef.current.find((s) => s.id === id);
    dragRef.current = {
      id,
      startX: cx,
      startY: cy,
      origX: sticker.x,
      origY: sticker.y,
    };

    const handlePointerMove = (e) => {
      const { x: cx, y: cy } = clientXY(e);
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      const current = stickersRef.current;
      onPlacedChange(
        current.map((s) =>
          s.id === id ? { ...s, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy } : s
        )
      );
    };

    const handlePointerUp = () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("touchend", handlePointerUp);
      document.removeEventListener("touchcancel", handlePointerUp);
    };

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, { passive: false });
    document.addEventListener("touchend", handlePointerUp);
    document.addEventListener("touchcancel", handlePointerUp);
  };

  // ── Resize sticker (mouse + touch) ──
  const handleResizePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const { x: startX, y: startY } = clientXY(e);
    const origW = sticker.width;
    const origH = sticker.height;

    const handlePointerMove = (e) => {
      const { x: cx } = clientXY(e);
      const dx = cx - startX;
      const scale = 1 + dx / 200;
      const newW = Math.max(20, origW * scale);
      const newH = Math.max(20, origH * scale);
      const current = stickersRef.current;
      onPlacedChange(
        current.map((s) =>
          s.id === id ? { ...s, width: newW, height: newH } : s
        )
      );
    };

    const handlePointerUp = () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("touchend", handlePointerUp);
      document.removeEventListener("touchcancel", handlePointerUp);
    };

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, { passive: false });
    document.addEventListener("touchend", handlePointerUp);
    document.addEventListener("touchcancel", handlePointerUp);
  };

  // ── Rotate sticker (mouse + touch) ──
  const handleRotatePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    const { x: cx, y: cy } = clientXY(e);
    const startAngle = Math.atan2(cy - centerY, cx - centerX);
    const origRotation = sticker.rotation || 0;

    const handlePointerMove = (e) => {
      const { x: cx, y: cy } = clientXY(e);
      const angle = Math.atan2(cy - centerY, cx - centerX);
      const delta = ((angle - startAngle) * 180) / Math.PI;
      const current = stickersRef.current;
      onPlacedChange(
        current.map((s) =>
          s.id === id ? { ...s, rotation: origRotation + delta } : s
        )
      );
    };

    const handlePointerUp = () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("touchend", handlePointerUp);
      document.removeEventListener("touchcancel", handlePointerUp);
    };

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, { passive: false });
    document.addEventListener("touchend", handlePointerUp);
    document.addEventListener("touchcancel", handlePointerUp);
  };

  const handleDelete = (id) => {
    onPlacedChange(stickersRef.current.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  // Deselect sticker when tapping/clicking anywhere outside a sticker
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest(".sticker-item") && !e.target.closest(".sticker-tray")) {
        setSelectedId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  // Handle drop from tray (desktop drag)
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const handleDragEnter = (e) => {
      const types = e.dataTransfer?.types;
      if (types && Array.from(types).includes("application/sticker")) {
        setIsDragActive(true);
      }
    };
    const handleDragEnd = () => setIsDragActive(false);
    const handleDropGlobal = () => setIsDragActive(false);

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDropGlobal);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDropGlobal);
    };
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragActive(false);
      const data = e.dataTransfer.getData("application/sticker");
      if (!data) return;
      const { stickerType, isCustom } = JSON.parse(data);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - 25;
      const y = e.clientY - rect.top - 25;

      const newSticker = {
        id: uid(),
        stickerType,
        isCustom: isCustom || false,
        x,
        y,
        width: 50,
        height: 50,
        rotation: 0,
      };

      onPlacedChange([...stickersRef.current, newSticker]);
    },
    [onPlacedChange]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Track which stickers have already played the pop-in animation
  const animatedRef = useRef(new Set());

  return (
    <div
      className="sticker-layer"
      style={{
        pointerEvents: isDragActive ? "auto" : "none",
        userSelect: "none",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {placedStickers.map((sticker) => {
        const isSelected = selectedId === sticker.id;
        const isNew = !animatedRef.current.has(sticker.id);
        if (isNew) animatedRef.current.add(sticker.id);
        return (
          <div
            key={sticker.id}
            style={{
              position: "absolute",
              left: sticker.x,
              top: sticker.y,
              width: sticker.width,
              height: sticker.height,
              transform: `rotate(${sticker.rotation || 0}deg)`,
              zIndex: isSelected ? 100 : 50,
              userSelect: "none",
              touchAction: "none",
            }}
            onMouseDown={(e) => handlePointerDown(e, sticker.id)}
            onTouchStart={(e) => handlePointerDown(e, sticker.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(sticker.id);
            }}
          >
            <div
              className={`sticker-item ${isNew ? "sticker-pop" : ""}`}
              style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
            >
              {getStickerContent(sticker)}
            </div>

            {isSelected && (
              <>
                {/* Delete button — bigger touch target */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(sticker.id);
                  }}
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-muted-pink text-white text-xs flex items-center justify-center cursor-pointer"
                  style={{ fontSize: "12px", lineHeight: 1, pointerEvents: "auto", userSelect: "none", touchAction: "none" }}
                  title="Delete sticker"
                >
                  ×
                </button>

                {/* Rotate handle — bigger touch target */}
                <div
                  onMouseDown={(e) => handleRotatePointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleRotatePointerDown(e, sticker.id)}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-dusty-blue cursor-grab flex items-center justify-center"
                  style={{ pointerEvents: "auto", userSelect: "none", touchAction: "none" }}
                  title="Rotate"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <path d="M4 12 Q4 4 12 4" fill="none" />
                    <path d="M2 6 L4 4 L6 6" fill="none" />
                  </svg>
                </div>

                {/* Resize handle — bigger touch target */}
                <div
                  onMouseDown={(e) => handleResizePointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleResizePointerDown(e, sticker.id)}
                  className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-sage cursor-se-resize"
                  style={{ pointerEvents: "auto", userSelect: "none", touchAction: "none" }}
                  title="Resize"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
