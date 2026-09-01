/* ========================================
   TODO STICKER LAYER — positions stickers relative to the todo container
   Uses percentage-based coordinates so the same visual relationship
   holds across all screen sizes (desktop → mobile).
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

export default function TodoStickerLayer({ placedStickers, onPlacedChange, customStickers }) {
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef({});
  const containerRef = useRef(null);
  const stickersRef = useRef(placedStickers);
  useEffect(() => { stickersRef.current = placedStickers; }, [placedStickers]);

  // Track active document listeners for cleanup
  const activeListenersRef = useRef([]);
  useEffect(() => {
    return () => {
      activeListenersRef.current.forEach(({ ev, handler, opts }) => {
        document.removeEventListener(ev, handler, opts);
      });
      activeListenersRef.current = [];
    };
  }, []);

  const addDocListener = (ev, handler, opts) => {
    document.addEventListener(ev, handler, opts);
    activeListenersRef.current.push({ ev, handler, opts });
  };
  const removeDocListener = (ev, handler, opts) => {
    document.removeEventListener(ev, handler, opts);
    activeListenersRef.current = activeListenersRef.current.filter(
      (l) => !(l.ev === ev && l.handler === handler)
    );
  };

  // Convert viewport pixels to percentage of the todo container
  const toContainerPercent = (vx, vy) => {
    const el = containerRef.current;
    if (!el) return { xP: 50, yP: 50 };
    const rect = el.getBoundingClientRect();
    return {
      xP: ((vx - rect.left) / rect.width) * 100,
      yP: ((vy - rect.top) / rect.height) * 100,
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
    setSelectedId(id);
    const { x: cx, y: cy } = clientXY(e);
    const sticker = stickersRef.current.find((s) => s.id === id);
    dragRef.current = { id, startX: cx, startY: cy, origXP: sticker.xP, origYP: sticker.yP };

    const onMove = (e) => {
      const { x: cx, y: cy } = clientXY(e);
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      const el = containerRef.current;
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
        removeDocListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    addDocListener("mousemove", onMove);
    addDocListener("mouseup", onUp);
    addDocListener("touchmove", onMove, { passive: false });
    addDocListener("touchend", onUp);
    addDocListener("touchcancel", onUp);
  };

  // ── Resize sticker ──
  const handleResizePointerDown = (e, id) => {
    e.stopPropagation();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const { x: startX } = clientXY(e);
    const origW = sticker.width;
    const onMove = (e) => {
      const { x: cx } = clientXY(e);
      const dx = cx - startX;
      const scale = 1 + dx / 200;
      onPlacedChange(stickersRef.current.map((s) =>
        s.id === id ? { ...s, width: Math.max(15, origW * scale), height: Math.max(15, origW * scale) } : s
      ));
    };
    const onUp = () => {
      ["mousemove", "mouseup", "touchmove", "touchend", "touchcancel"].forEach((ev) =>
        removeDocListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    addDocListener("mousemove", onMove);
    addDocListener("mouseup", onUp);
    addDocListener("touchmove", onMove, { passive: false });
    addDocListener("touchend", onUp);
    addDocListener("touchcancel", onUp);
  };

  // ── Rotate sticker ──
  const handleRotatePointerDown = (e, id) => {
    e.stopPropagation();
    const sticker = stickersRef.current.find((s) => s.id === id);
    const el = containerRef.current;
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
        removeDocListener(ev, ev.includes("move") ? onMove : onUp)
      );
    };
    addDocListener("mousemove", onMove);
    addDocListener("mouseup", onUp);
    addDocListener("touchmove", onMove, { passive: false });
    addDocListener("touchend", onUp);
    addDocListener("touchcancel", onUp);
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
    e.stopPropagation();
    setIsDragActive(false);
    const data = e.dataTransfer?.getData("application/sticker");
    if (!data) return;
    const { stickerType, isCustom } = JSON.parse(data);
    const { xP, yP } = toContainerPercent(e.clientX, e.clientY);
    onPlacedChange([...stickersRef.current, {
      id: uid(), stickerType, isCustom: isCustom || false,
      xP, yP, width: 40, height: 40, rotation: 0,
    }]);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; };

  const animatedRef = useRef(new Set());

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
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

        // Scale sticker size proportionally based on container width
        // Use viewport width as reference: 40px at 1000px → smaller on mobile
        const containerWidth = containerRef.current?.getBoundingClientRect().width || 400;
        const scaleFactor = Math.min(1, containerWidth / 500);
        const scaledW = sticker.width * scaleFactor;
        const scaledH = sticker.height * scaleFactor;

        return (
          <div
            key={sticker.id}
            style={{
              position: "absolute",
              left: `${sticker.xP || 50}%`,
              top: `${sticker.yP || 50}%`,
              width: scaledW,
              height: scaledH,
              transform: `rotate(${sticker.rotation || 0}deg)`,
              zIndex: isSelected ? 20 : 15,
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
                  className="absolute -top-3 -right-3 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center cursor-pointer"
                  style={{ fontSize: "10px", lineHeight: 1, pointerEvents: "auto", userSelect: "none", touchAction: "none", background: 'var(--color-muted-pink)' }}
                  title="Delete sticker"
                >×</button>

                <div
                  onMouseDown={(e) => handleRotatePointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleRotatePointerDown(e, sticker.id)}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full cursor-grab flex items-center justify-center"
                  style={{ pointerEvents: "auto", userSelect: "none", touchAction: "none", background: "var(--color-dusty-blue)" }}
                  title="Rotate"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <path d="M4 12 Q4 4 12 4" fill="none" />
                    <path d="M2 6 L4 4 L6 6" fill="none" />
                  </svg>
                </div>

                <div
                  onMouseDown={(e) => handleResizePointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleResizePointerDown(e, sticker.id)}
                  className="absolute -bottom-3 -right-3 w-5 h-5 rounded-full cursor-se-resize"
                  style={{ pointerEvents: "auto", userSelect: "none", touchAction: "none", background: 'var(--color-sage)' }}
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
