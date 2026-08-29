/* ========================================
   STICKER LAYER — rendered inside the right page scroll area
   Uses position:absolute so stickers scroll with content.
   Stores positions as viewport percentages for orientation resilience.
   ======================================== */
import React, { useState, useRef, useEffect } from "react";
import { uid } from "../store";
import { BUILTIN_STICKERS } from "./StickerTray";

function clientXY(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

export default function StickerLayer({ placedStickers, onPlacedChange, customStickers, containerRef }) {
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef({});
  const stickersRef = useRef(placedStickers);
  useEffect(() => { stickersRef.current = placedStickers; }, [placedStickers]);

  // Convert viewport pixels to percentage of container, and back
  const toPercent = (vx, vy) => {
    const el = containerRef?.current;
    if (!el) return { xP: vx, yP: vy };
    const rect = el.getBoundingClientRect();
    return {
      xP: ((vx - rect.left) / rect.width) * 100,
      yP: ((vy - rect.top + el.scrollTop) / rect.height) * 100,
    };
  };
  const toPixels = (xP, yP) => {
    const el = containerRef?.current;
    if (!el) return { x: xP, y: yP };
    const rect = el.getBoundingClientRect();
    return {
      x: (xP / 100) * rect.width + rect.left,
      y: (yP / 100) * rect.height + rect.top - el.scrollTop,
    };
  };

  const getStickerContent = (sticker) => {
    if (sticker.isCustom) {
      const custom = customStickers.find((cs) => cs.id === sticker.stickerType);
      if (custom) return <img src={custom.imageDataUrl} alt={custom.name} className="w-full h-full object-contain" draggable={false} />;
      return null;
    }
    const svg = BUILTIN_STICKERS[sticker.stickerType];
    if (!svg) return null;
    return <div className="w-full h-full">{svg}</div>;
  };

  // ── Move sticker ──
  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const { x: cx, y: cy } = clientXY(e);
    const sticker = stickersRef.current.find((s) => s.id === id);
    dragRef.current = { id, startX: cx, startY: cy, origXP: sticker.xP, origYP: sticker.yP };

    const onMove = (e) => {
      const { x: cx, y: cy } = clientXY(e);
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      const el = containerRef?.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dxP = (dx / rect.width) * 100;
      const dyP = (dy / rect.height) * 100;
      onPlacedChange(stickersRef.current.map((s) =>
        s.id === id ? { ...s, xP: dragRef.current.origXP + dxP, yP: dragRef.current.origYP + dyP } : s
      ));
    };
    const onUp = () => {
      ["mousemove", "mouseup", "touchmove", "touchend", "touchcancel"].forEach((ev) =>
        document.removeEventListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  };

  // ── Resize sticker ──
  const handleResizePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const { x: startX } = clientXY(e);
    const origW = sticker.width;
    const onMove = (e) => {
      const { x: cx } = clientXY(e);
      const dx = cx - startX;
      const scale = 1 + dx / 200;
      onPlacedChange(stickersRef.current.map((s) =>
        s.id === id ? { ...s, width: Math.max(20, origW * scale), height: Math.max(20, origW * scale) } : s
      ));
    };
    const onUp = () => {
      ["mousemove", "mouseup", "touchmove", "touchend", "touchcancel"].forEach((ev) =>
        document.removeEventListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  };

  // ── Rotate sticker ──
  const handleRotatePointerDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const el = containerRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = (sticker.xP / 100) * rect.width + sticker.width / 2;
    const centerY = (sticker.yP / 100) * rect.height + sticker.height / 2;
    const { x: cx, y: cy } = clientXY(e);
    const startAngle = Math.atan2(cy - rect.top - centerY, cx - rect.left - centerX);
    const origRotation = sticker.rotation || 0;

    const onMove = (e) => {
      const { x: cx, y: cy } = clientXY(e);
      const angle = Math.atan2(cy - rect.top - centerY, cx - rect.left - centerX);
      const delta = ((angle - startAngle) * 180) / Math.PI;
      onPlacedChange(stickersRef.current.map((s) =>
        s.id === id ? { ...s, rotation: origRotation + delta } : s
      ));
    };
    const onUp = () => {
      ["mousemove", "mouseup", "touchmove", "touchend", "touchcancel"].forEach((ev) =>
        document.removeEventListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  };

  const handleDelete = (id) => {
    onPlacedChange(stickersRef.current.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  // Deselect on tap/click outside
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

  // ── Drop from tray (desktop) ──
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const handleDragEnter = (e) => {
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("application/sticker")) {
        setIsDragActive(true);
      }
    };
    const off = () => setIsDragActive(false);
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragend", off);
    document.addEventListener("drop", off);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragend", off);
      document.removeEventListener("drop", off);
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const data = e.dataTransfer?.getData("application/sticker");
    if (!data) return;
    const { stickerType, isCustom } = JSON.parse(data);
    const { xP, yP } = toPercent(e.clientX, e.clientY);
    onPlacedChange([...stickersRef.current, {
      id: uid(), stickerType, isCustom: isCustom || false,
      xP, yP, width: 50, height: 50, rotation: 0,
    }]);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  const animatedRef = useRef(new Set());

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: isDragActive ? "auto" : "none",
        userSelect: "none",
        overflow: "visible",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {placedStickers.map((sticker) => {
        const isSelected = selectedId === sticker.id;
        const isNew = !animatedRef.current.has(sticker.id);
        if (isNew) animatedRef.current.add(sticker.id);

        // Convert percentage back to pixel offset for rendering
        const el = containerRef?.current;
        let renderLeft = sticker.xP || 0;
        let renderTop = sticker.yP || 0;
        if (el) {
          const rect = el.getBoundingClientRect();
          renderLeft = (sticker.xP / 100) * rect.width;
          renderTop = (sticker.yP / 100) * rect.height;
        }

        return (
          <div
            key={sticker.id}
            style={{
              position: "absolute",
              left: `${sticker.xP}%`,
              top: `${sticker.yP}%`,
              width: sticker.width,
              height: sticker.height,
              transform: `rotate(${sticker.rotation || 0}deg)`,
              zIndex: isSelected ? 100 : 51,
              userSelect: "none",
              touchAction: "none",
            }}
            onMouseDown={(e) => handlePointerDown(e, sticker.id)}
            onTouchStart={(e) => handlePointerDown(e, sticker.id)}
            onClick={(e) => { e.stopPropagation(); setSelectedId(sticker.id); }}
          >
            <div
              className={`sticker-item ${isNew ? "sticker-pop" : ""}`}
              style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
            >
              {getStickerContent(sticker)}
            </div>

            {isSelected && (
              <>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleDelete(sticker.id); }}
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-muted-pink text-white text-xs flex items-center justify-center cursor-pointer"
                  style={{ fontSize: "12px", lineHeight: 1, pointerEvents: "auto", userSelect: "none", touchAction: "none" }}
                  title="Delete sticker"
                >×</button>

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
