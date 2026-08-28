/* ========================================
   STICKER TRAY — panel of draggable stickers
   Built-in SVG stickers + custom uploads.
   Lives in outer margin, toggled open/closed.
   ======================================== */
import React, { useState, useRef } from "react";
import { uid } from "../store";

/* ── Built-in sticker SVGs (hand-drawn style) ────── */

const BUILTIN_STICKERS = {
  star: (
    <svg viewBox="0 0 24 24" fill="#f0dfa0" stroke="#c9b06b" strokeWidth="1.2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="#d9a5a5" stroke="#c97b7b" strokeWidth="1.2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  cat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.3" strokeLinecap="round">
      <path d="M5 3 L3 10 Q3 14 7 16 L7 20 L10 18 L14 18 L17 20 L17 16 Q21 14 21 10 L19 3" />
      <circle cx="9" cy="11" r="1" fill="#8a7a6a" />
      <circle cx="15" cy="11" r="1" fill="#8a7a6a" />
      <path d="M11 13 Q12 14 13 13" />
      <path d="M8 14 L5 15" />
      <path d="M16 14 L19 15" />
    </svg>
  ),
  coffee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.3" strokeLinecap="round">
      <path d="M5 9 h12 v8 Q17 21 12 21 Q7 21 7 17 Z" fill="#f0dfa0" />
      <path d="M17 11 Q21 11 21 14 Q21 17 17 17" />
      <path d="M8 6 Q8 4 10 3" strokeDasharray="2 1" />
      <path d="M12 6 Q12 4 14 3" strokeDasharray="2 1" />
    </svg>
  ),
  robot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.3" strokeLinecap="round">
      <rect x="5" y="8" width="14" height="12" rx="3" fill="#c5d8e6" />
      <circle cx="9" cy="14" r="1.5" fill="#8a7a6a" />
      <circle cx="15" cy="14" r="1.5" fill="#8a7a6a" />
      <path d="M9 17 Q12 19 15 17" />
      <path d="M8 4 Q12 2 16 4" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <circle cx="12" cy="3" r="1" fill="#f0dfa0" />
    </svg>
  ),
  flower: (
    <svg viewBox="0 0 24 24" fill="#d9a5a5" stroke="#c97b7b" strokeWidth="1">
      <circle cx="12" cy="10" r="3" fill="#f0dfa0" stroke="#c9b06b" />
      <ellipse cx="12" cy="4" rx="3" ry="4" />
      <ellipse cx="12" cy="16" rx="3" ry="4" />
      <ellipse cx="6" cy="10" rx="4" ry="3" />
      <ellipse cx="18" cy="10" rx="4" ry="3" />
      <path d="M12 17 L12 22" stroke="#6b8a5e" strokeWidth="1.5" />
      <path d="M12 19 Q9 18 8 20" stroke="#6b8a5e" strokeWidth="1.2" fill="none" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="#c5d8e6" stroke="#9bb4c9" strokeWidth="1.2">
      <path d="M6 17 Q2 17 2 14 Q2 11 5 11 Q5 7 9 7 Q12 5 15 7 Q19 7 19 10 Q22 10 22 13 Q22 17 18 17 Z" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="#f0dfa0" stroke="#c9b06b" strokeWidth="1.2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="#b8c9a3" stroke="#8a9a7a" strokeWidth="1">
      <path d="M12 0 L14 8 L22 8 L16 13 L18 21 L12 16 L6 21 L8 13 L2 8 L10 8 Z" />
    </svg>
  ),
  spider: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="10" r="5" fill="#6a5a4a" />
      <circle cx="10" cy="9" r="1" fill="white" />
      <circle cx="14" cy="9" r="1" fill="white" />
      <circle cx="10" cy="9" r="0.5" fill="#333" />
      <circle cx="14" cy="9" r="0.5" fill="#333" />
      {/* legs */}
      <path d="M7 8 Q3 5 2 2" />
      <path d="M8 7 Q5 3 5 0" />
      <path d="M17 8 Q21 5 22 2" />
      <path d="M16 7 Q19 3 19 0" />
      <path d="M7 12 Q3 14 1 14" />
      <path d="M8 13 Q5 16 4 18" />
      <path d="M17 12 Q21 14 23 14" />
      <path d="M16 13 Q19 16 20 18" />
      {/* web line */}
      <path d="M12 5 L12 0" strokeDasharray="1 2" opacity="0.5" />
    </svg>
  ),
};

export { BUILTIN_STICKERS };

export default function StickerTray({ onStickerDrag, customStickers, onCustomStickersChange }) {
  const [open, setOpen] = useState(false);
  const [draggingSticker, setDraggingSticker] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newSticker = {
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, ""),
        imageDataUrl: reader.result,
      };
      onCustomStickersChange([...customStickers, newSticker]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = () => {
          const newSticker = {
            id: uid(),
            name: "pasted-sticker",
            imageDataUrl: reader.result,
          };
          onCustomStickersChange([...customStickers, newSticker]);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleDragStart = (e, stickerType, isCustom = false) => {
    e.dataTransfer.setData("application/sticker", JSON.stringify({ stickerType, isCustom }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <>
      {/* Toggle button — always visible in outer margin */}
      <button
        onClick={() => setOpen(!open)}
        className="sticker-tray fixed bottom-4 right-4 z-50 rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        style={{
          background: "var(--sticker-tray-bg)",
          border: "2px solid rgba(255,255,255,0.5)",
          cursor: "pointer",
          pointerEvents: "auto",
        }}
        title="Sticker tray"
      >
        <span className="text-lg">✿</span>
      </button>

      {/* Tray panel */}
      {open && (
        <div
          className="sticker-tray fixed bottom-16 right-4 z-50 rounded-xl p-3 shadow-xl tray-panel-enter"
          style={{
            background: "var(--tray-bg)",
            border: "1.5px solid var(--tray-border)",
            maxHeight: "60vh",
            overflowY: "auto",
            pointerEvents: "auto",
            minWidth: "200px",
          }}
          onPaste={handlePaste}
          tabIndex={0}
        >
          <div className="font-hand text-sm font-bold mb-2" style={{ color: "var(--text-muted)" }}>
            stickers
          </div>

          {/* Built-in stickers grid */}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {Object.entries(BUILTIN_STICKERS).map(([name, svg]) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => handleDragStart(e, name)}
                className="w-9 h-9 rounded-md flex items-center justify-center cursor-grab hover:bg-white/60 transition-colors"
                title={`Drag ${name}`}
              >
                <div className="w-7 h-7">{svg}</div>
              </div>
            ))}
          </div>

          {/* Custom stickers */}
          {customStickers.length > 0 && (
            <>
              <div className="font-hand text-sm mb-1" style={{ color: "var(--text-faint)" }}>
                custom
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {customStickers.map((cs) => (
                  <div
                    key={cs.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cs.id, true)}
                    className="w-9 h-9 rounded-md flex items-center justify-center cursor-grab hover:bg-white/60 transition-colors overflow-hidden"
                    title={`Drag ${cs.name}`}
                  >
                    <img
                      src={cs.imageDataUrl}
                      alt={cs.name}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-sm font-hand py-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors"
            style={{ color: "var(--text-muted)", border: "1px dashed var(--border-strong)", cursor: "pointer" }}
          >
            + upload sticker
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}
    </>
  );
}
