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

// ── Pinch-to-zoom (centers on pinch, feels native) ──────────
(function initPinchZoom() {
  const el = document.documentElement;
  let scale = 1;
  let lastDist = 0;
  let startScale = 1;
  let originX = 0;
  let originY = 0;

  function dist(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    lastDist = dist(e.touches[0], e.touches[1]);
    startScale = scale;
    originX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    originY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const d = dist(e.touches[0], e.touches[1]);
    const newScale = Math.min(Math.max(startScale * (d / lastDist), 0.5), 4);
    scale = newScale;
    document.body.style.transformOrigin = `${originX}px ${originY}px`;
    document.body.style.transform = `scale(${scale})`;
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (e.touches.length >= 2) return;
    // Zoom out always snaps back to 1x — only zoom in persists
    if (scale < 1) {
      scale = 1;
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    } else if (scale < 1.05) {
      // Close to 1x, snap clean
      scale = 1;
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    }
  });
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
