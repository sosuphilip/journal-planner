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

// ── Pinch-to-zoom (centers on pinch, simple rules) ──────────
(function initPinchZoom() {
  let scale = 1;
  let lastDist = 0;
  let startScale = 1;
  let originX = 0;
  let originY = 0;
  let pinching = false;

  function dist(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function hardReset() {
    scale = 1;
    pinching = false;
    document.body.style.transition = '';
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
  }

  function smoothReset() {
    if (scale === 1) return;
    document.body.style.transition = 'transform 0.25s ease-out';
    scale = 1;
    pinching = false;
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    setTimeout(() => { document.body.style.transition = ''; }, 300);
  }

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      // Start pinch
      e.preventDefault();
      pinching = true;
      lastDist = dist(e.touches[0], e.touches[1]);
      startScale = scale;
      originX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      originY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1 && !pinching) {
      // Single finger tap — always reset if zoomed
      if (scale !== 1) smoothReset();
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2 || !pinching) return;
    e.preventDefault();
    const d = dist(e.touches[0], e.touches[1]);
    scale = Math.min(Math.max(startScale * (d / lastDist), 0.5), 4);
    document.body.style.transition = 'none';
    document.body.style.transformOrigin = `${originX}px ${originY}px`;
    document.body.style.transform = `scale(${scale})`;
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) pinching = false;
    // Snap back if zoomed out below 1x or very close to 1x
    if (scale <= 1.05) smoothReset();
  });

  // Hard reset on any input interaction
  document.addEventListener('focusin', hardReset);
  document.addEventListener('focusout', () => setTimeout(hardReset, 100));
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
