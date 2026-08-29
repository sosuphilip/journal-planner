import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Viewport height tracker ──────────────────────────────────
// mobile browsers report 100vh/100dvh incorrectly (includes address bar).
// window.visualViewport.height gives the REAL visible height.
function updateVH() {
  const vh = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
updateVH();
window.visualViewport?.addEventListener('resize', updateVH);
window.addEventListener('resize', updateVH);
// Also update on orientation change
window.addEventListener('orientationchange', () => {
  setTimeout(updateVH, 100);
});

// ── Pinch-to-zoom centered on pinch point ─────────────────────
let currentScale = 1;
let pinchStartDist = 0;
let pinchStartScale = 1;
let pinchCenterX = 0;
let pinchCenterY = 0;
const root = document.getElementById('root');

function getDistance(t1, t2) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

root.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    pinchStartDist = getDistance(e.touches[0], e.touches[1]);
    pinchStartScale = currentScale;
    const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    pinchCenterX = mx;
    pinchCenterY = my;
    root.style.transformOrigin = `${mx}px ${my}px`;
  }
}, { passive: false });

root.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dist = getDistance(e.touches[0], e.touches[1]);
    currentScale = Math.min(Math.max(pinchStartScale * (dist / pinchStartDist), 0.5), 3);
    root.style.transform = `scale(${currentScale})`;
  }
}, { passive: false });

root.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) {
    // Snap back to 1 if close
    if (currentScale > 0.9 && currentScale < 1.1) {
      currentScale = 1;
      root.style.transform = '';
      root.style.transformOrigin = '';
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
