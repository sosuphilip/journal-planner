# Journal Planner — Session Log (Aug 29, 2026)

## Repository
- GitHub: https://github.com/sosuphilip/journal-planner.git
- Branch: main
- Stack: React 19 + Vite + Tailwind CSS v4 + Supabase

---

## Fixes Completed

### 1. Layout Overflow (100vw → 100%)
- **Problem**: `width: 100vw` on html/body/#root and notebook-spread caused horizontal scrollbar
- **Fix**: Changed all `100vw` to `100%` across CSS and App.jsx

### 2. Mobile Landscape Height Bug
- **Problem**: Content pushed down in landscape, had to zoom out to see UI
- **Root cause**: CSS `100vh` includes browser chrome; media query cascade was wrong
- **Fix**: Used `--vh` JS variable tracking `window.visualViewport.height`, set in `<head>` script before CSS paint
- **Later simplified to**: `100dvh` CSS units + body `position: fixed; inset: 0`

### 3. iPhone Notch Safe Areas (Landscape)
- **Problem**: Content going under the notch in landscape
- **Fix**: 
  - Added `viewport-fit=cover` to viewport meta
  - Added `env(safe-area-inset-top)` padding to `.app-shell` in landscape media query
  - Only top + left/right insets (no bottom — caused gap)

### 4. Decorative Tabs — Pinned to Notebook Edge
- **Problem**: Tabs (2026, Aug 29, colored squares) were floating on the screen, not attached to notebook
- **Fix**: Moved tabs from `.app-shell` children into a `.notebook-tabs` wrapper that's a sibling of `.notebook-spread`, both inside a `position: relative` parent
- **Positioning**: Right side (to avoid notch), negative offsets to stick out from notebook edge
  - 2026 tab: `right: -48px`, rotated -90deg
  - Aug 29 tab: `right: -40px`, rotated -90deg
  - Colored squares: `right: -14px`, below text tabs at `top: 58%`

### 5. Journal + Days Scroll
- **Problem**: No scrolling on either page
- **Fix**: 
  - Left page days container: `overflow-y-auto`
  - Right page scroll container: `overflow: auto` (was hidden in mobile landscape)
  - Added `no-scrollbar` class globally

### 6. Scrollbar Hiding
- **Problem**: Scrollbars showing during scroll
- **Fix**: Global CSS rules for all browsers:
  - `::-webkit-scrollbar { display: none }`
  - `* { scrollbar-width: none; -ms-overflow-style: none }`

### 7. Dark Mode Toggle Size
- **Problem**: Too small to tap on mobile
- **Fix**: `w-11 h-11` (44px) on mobile, `w-7 h-7` on desktop

### 8. Dark Mode Colors (Light Mode Readability)
- **Problem**: Text was too light/hard to read in light mode
- **Root cause**: Tailwind `@theme` colors were hardcoded hex values that didn't change with dark mode
- **Fix**:
  - Removed color definitions from `@theme` block
  - Added them to `:root` (light) and `.dark` (dark) CSS variable blocks
  - Replaced all Tailwind color utilities (`text-dusty-blue`, `text-sage`, etc.) with inline styles using `var(--color-*)`

### 9. Dark Mode Theme-Color + Status Bar
- **Problem**: Status bar didn't switch with dark mode
- **Fix**:
  - Dynamic `theme-color` meta tag updates on toggle
  - `apple-mobile-web-app-status-bar-style: black-translucent` (iOS limitation — can't change dynamically)
  - `color-scheme` CSS property for browser UI adaptation
  - Head script applies `.dark` class + theme-color at launch based on localStorage

### 10. Pinch-to-Zoom
- **Problem**: Chrome native zoom goes to top-left corner; custom zoom kept getting stuck
- **Solution**: Disabled zoom entirely
  - `maximum-scale=1.0, user-scalable=no` in viewport meta
  - `touch-action: manipulation` on body
  - Removed all custom zoom JS code
  - **Note**: This was the user's preference after many iterations

### 11. Keyboard Pushing UI (Landscape)
- **Problem**: Virtual keyboard pushes UI up in landscape
- **Fix**: `interactive-widget=overlays-content` in viewport meta (Android Chrome)
- **iOS limitation**: iOS PWAs don't support this — keyboard still pushes content

### 12. Add Item Doesn't Switch Views
- **Problem**: Clicking "add item" in checklist triggered day row's `onSelect`, opening journal
- **Fix**: 
  - Moved `onClick={onSelect}` from entire day row to just the date/label area
  - Added `e.stopPropagation()` on add item/habit buttons

### 13. Todo Card — Per-Day (Not Per-Week)
- **Problem**: Todo card was shared across all days in a week
- **Fix**: Moved `todoCard` from week-level to inside each day object
  - Each day has its own `todoCard: { title, items }`
  - `blankWeek()` now includes `todoCard` per day
  - `updateTodoCard` writes to `days[selectedDayIndex].todoCard`
  - Removed `todo_card` from Supabase weeks table (now inside `days_data`)

### 14. Sticker Tray
- **Icon**: Changed from ✿ (flower) to ⭐ (star) — looked like settings icon
- **Panel animation**: Was scaling the entire tray (button + panel). Fixed to only scale the button
- **Button size**: `w-14 h-14` (56px) on mobile, `w-10 h-10` on desktop

### 15. Journal Click Only Opens on Date/Label
- **Problem**: Tapping anywhere on day row opened journal
- **Fix**: Only the date numeral + day label area triggers `onSelect`

---

## Files Modified
- `index.html` — viewport meta, head script (vh + dark mode), theme-color, apple status bar
- `src/main.jsx` — VH tracker, removed custom zoom code
- `src/index.css` — All theme variables, dark mode variables, responsive rules, scrollbar hiding
- `src/App.jsx` — Layout, dark mode toggle, todo card per-day, tab positioning
- `src/store.js` — blankWeek() with todoCard per day, seed data
- `src/lib/cloudStore.js` — Removed week-level todoCard from save/load
- `src/components/Header.jsx` — Toggle size, CSS variable colors
- `src/components/DayRow.jsx` — Click handler on date area only, CSS variable colors
- `src/components/Checklist.jsx` — Stop propagation on add, CSS variable colors
- `src/components/HabitAreas.jsx` — Stop propagation on add, CSS variable colors
- `src/components/TodoCard.jsx` — CSS variable colors
- `src/components/StickerTray.jsx` — Star icon, bigger button, panel scale fix
- `src/components/StickerLayer.jsx` — CSS variable colors
- `src/components/JournalPanel.jsx` — CSS variable colors for mood line
- `supabase-schema.sql` — Added todo_card column to weeks (now unused, todoCard is in days_data)

---

## Known Limitations
- **iOS status bar**: Can't change dynamically in PWA — stuck with `black-translucent`
- **iOS keyboard**: Still pushes UI in landscape (no `interactive-widget` support on iOS)
- **Zoom**: Disabled entirely — Chrome's native pinch-zoom can't be centered without custom code that causes stuck states

---

## User's Phone Setup
- iPhone 11 (notch on left in landscape)
- Chrome browser (not Safari)
- Added to home screen as PWA (standalone mode)
- Uses dark mode

---

## Next Session Starting Point
- All changes are committed and pushed to `main`
- App is functional with per-day todo cards, working dark mode, scroll on both pages
- Safe areas handled for iPhone notch in landscape
- Tabs pinned to notebook edge on right side
