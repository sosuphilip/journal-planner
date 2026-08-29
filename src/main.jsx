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



// ── Pinch-to-zoom (centered, always resets on release) ───────
(function initPinchZoom() {
  let lastDist = 0;
  let originX = 0;
  let originY = 0;
  let pinching = false;

  function d(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function clearZoom() {
    pinching = false;
    document.body.style.cssText = '';
  }

  document.addEventListener('touchstart', (e) => {
    // Always force-clear any lingering state from previous gesture
    if (document.body.style.transform) clearZoom();
    if (e.touches.length !== 2) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    pinching = true;
    lastDist = d(e.touches[0], e.touches[1]);
    originX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    originY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!pinching || e.touches.length !== 2) return;
    e.preventDefault();
    const cur = d(e.touches[0], e.touches[1]);
    const scale = Math.min(Math.max(cur / lastDist, 0.5), 3);
    document.body.style.transition = 'none';
    document.body.style.transformOrigin = `${originX}px ${originY}px`;
    document.body.style.transform = `scale(${scale})`;
  }, { passive: false });

  document.addEventListener('touchend', clearZoom);
  document.addEventListener('touchcancel', clearZoom);
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
