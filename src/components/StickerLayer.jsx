/* ========================================
   STICKER LAYER — rendered above page content
   Handles placement, drag, resize, rotate, delete.
   ======================================== */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { uid } from "../store";
import { BUILTIN_STICKERS } from "./StickerTray";

export default function StickerLayer({ placedStickers, onPlacedChange, customStickers }) {
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef({});

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

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    const sticker = placedStickers.find((s) => s.id === id);
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticker.x,
      origY: sticker.y,
    };

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onPlacedChange(
        placedStickers.map((s) =>
          s.id === id ? { ...s, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy } : s
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e, id) => {
    e.stopPropagation();
    const sticker = placedStickers.find((s) => s.id === id);
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = sticker.width;
    const origH = sticker.height;

    const handleMouseMove = (e) => {
      const dx = e.clientX - startX;
      const scale = 1 + dx / 200;
      const newW = Math.max(20, origW * scale);
      const newH = Math.max(20, origH * scale);
      onPlacedChange(
        placedStickers.map((s) =>
          s.id === id ? { ...s, width: newW, height: newH } : s
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRotateMouseDown = (e, id) => {
    e.stopPropagation();
    const sticker = placedStickers.find((s) => s.id === id);
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const origRotation = sticker.rotation || 0;

    const handleMouseMove = (e) => {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const delta = ((angle - startAngle) * 180) / Math.PI;
      onPlacedChange(
        placedStickers.map((s) =>
          s.id === id ? { ...s, rotation: origRotation + delta } : s
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDelete = (id) => {
    onPlacedChange(placedStickers.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  // Handle drop from tray
  const [isDragActive, setIsDragActive] = useState(false);

  // Enable pointer-events on the layer when a sticker drag is active
  useEffect(() => {
    const handleDragEnter = (e) => {
      // Only react to sticker drags (from the tray)
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

      onPlacedChange([...placedStickers, newSticker]);
    },
    [placedStickers, onPlacedChange]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <div
      className="sticker-layer"
      style={{ pointerEvents: isDragActive ? "auto" : undefined }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => setSelectedId(null)}
    >
      {placedStickers.map((sticker) => {
        const isSelected = selectedId === sticker.id;
        return (
          <div
            key={sticker.id}
            className={`sticker-item ${isSelected ? "" : "sticker-pop"}`}
            style={{
              left: sticker.x,
              top: sticker.y,
              width: sticker.width,
              height: sticker.height,
              transform: `rotate(${sticker.rotation || 0}deg)`,
              zIndex: isSelected ? 100 : 50,
            }}
            onMouseDown={(e) => handleMouseDown(e, sticker.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(sticker.id);
            }}
          >
            {getStickerContent(sticker)}

            {/* Controls when selected */}
            {isSelected && (
              <>
                {/* Delete button */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(sticker.id);
                  }}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-muted-pink text-white text-xs flex items-center justify-center cursor-pointer"
                  style={{ fontSize: "9px", lineHeight: 1, pointerEvents: "auto" }}
                  title="Delete sticker"
                >
                  ×
                </button>

                {/* Rotate handle */}
                <div
                  onMouseDown={(e) => handleRotateMouseDown(e, sticker.id)}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-dusty-blue cursor-grab"
                  style={{ pointerEvents: "auto" }}
                  title="Rotate"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <path d="M4 12 Q4 4 12 4" fill="none" />
                    <path d="M2 6 L4 4 L6 6" fill="none" />
                  </svg>
                </div>

                {/* Resize handle */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, sticker.id)}
                  className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-sage cursor-se-resize"
                  style={{ pointerEvents: "auto" }}
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
