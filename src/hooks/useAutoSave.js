/* ========================================
   useAutoSave — debounced localStorage writer
   ======================================== */
import { useEffect, useRef, useCallback } from "react";

/**
 * Calls `saveFn` (which should write to localStorage) after `delay` ms
 * of no changes. Stores a snapshot and compares to avoid redundant writes.
 */
export function useAutoSave(data, saveFn, delay = 400) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveFn(data);
      lastSavedRef.current = JSON.stringify(data);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, saveFn, delay]);
}

/**
 * A simpler debounced callback — useful for individual field saves
 */
export function useDebouncedCallback(fn, delay = 400) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}
