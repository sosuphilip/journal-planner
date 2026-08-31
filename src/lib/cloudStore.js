/* ========================================
   CLOUD STORE — Supabase-backed persistence
   Same API as the localStorage store,
   but data lives per-user in the cloud.
   ======================================== */
import { supabase } from "./supabase";
import { uid, fmtDate } from "../store";

// ── Helpers ──────────────────────────────────────────────

/**
 * Ensure we have a valid session before making queries.
 * Attempts to refresh if the current session is expired.
 * Returns true if a valid session exists, false otherwise.
 */
async function ensureSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("Session check failed:", error.message);
      return false;
    }
    if (!session) {
      console.warn("No active session — user may need to re-authenticate");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to check session:", err);
    return false;
  }
}

/**
 * Execute a Supabase query with retry on 401 errors.
 * On 401, tries to refresh the session once, then retries.
 */
async function queryWithRetry(queryFn, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await queryFn();

    // Check for auth errors (Supabase returns these in the error object)
    if (result.error) {
      const msg = result.error.message || "";
      const status = result.error.status || result.error.code || 0;

      // 401 / JWT expired / auth errors
      if (status === 401 || msg.includes("JWT") || msg.includes("expired") || msg.includes("invalid_token")) {
        if (attempt < maxRetries) {
          console.warn(`Auth error on attempt ${attempt + 1}, refreshing session...`);
          try {
            await supabase.auth.refreshSession();
          } catch (refreshErr) {
            console.error("Session refresh failed:", refreshErr);
            return result; // return the original error
          }
          continue; // retry
        }
      }
    }

    return result;
  }
  // Should not reach here, but just in case
  return { data: null, error: new Error("Query failed after retries") };
}

// ── Public API ───────────────────────────────────────────

const CACHE_KEY = "planner-cloud-cache";

/** Save cloud data to localStorage for instant loading next time */
function cacheCloudData(userId, data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, data }));
  } catch { /* quota exceeded, ignore */ }
}

/** Load cached data from localStorage (returns null if missing or wrong user) */
function loadCachedData(userId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.userId === userId ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Load all user data from Supabase (queries run in parallel) */
export async function loadCloudStore(userId) {
  // Validate session first — if expired, try to refresh before querying
  const hasSession = await ensureSession();
  if (!hasSession) {
    console.warn("No valid session for loadCloudStore — falling back to cache");
  }

  // Run both queries in parallel with retry on auth errors
  const [weeksResult, settingsResult] = await Promise.allSettled([
    queryWithRetry(() =>
      supabase.from("weeks").select("*").eq("user_id", userId)
    ),
    queryWithRetry(() =>
      supabase.from("settings").select("*").eq("user_id", userId).maybeSingle()
    ),
  ]);

  // Parse weeks
  let weeks = {};
  const weeksOk = weeksResult.status === "fulfilled" && weeksResult.value.data;
  if (weeksOk) {
    for (const row of weeksResult.value.data) {
      weeks[row.week_start] = { days: row.days_data, habits: row.habits_data || [] };
    }
  }

  // Parse settings
  const settingsOk = settingsResult.status === "fulfilled" && settingsResult.value.data;
  const settings = settingsOk ? settingsResult.value.data : null;

  const cloudData = {
    weeks,
    habits: settings?.habits || [],
    waterTrack: settings?.water_track || {},
    customStickers: settings?.custom_stickers || [],
    placedStickers: settings?.placed_stickers || [],
  };

  // Only cache if BOTH queries succeeded — avoid caching partial/empty data
  // that would overwrite good cached data on next load
  if (weeksOk && settingsOk) {
    cacheCloudData(userId, cloudData);
  }

  return cloudData;
}

/** Load from cache instantly (synchronous, no network) */
export function loadCachedCloudStore(userId) {
  return loadCachedData(userId);
}

/** Save a single week to Supabase. Returns { ok, error }. */
export async function saveWeek(userId, weekStart, weekData) {
  const { error } = await queryWithRetry(() =>
    supabase.from("weeks").upsert(
      {
        user_id: userId,
        week_start: weekStart,
        days_data: weekData.days,
        habits_data: weekData.habits || [],
      },
      { onConflict: "user_id,week_start" }
    )
  );
  if (error) {
    console.error("Failed to save week:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

/** Save settings to Supabase. Returns { ok, error }. */
export async function saveSettings(userId, store) {
  const { error } = await queryWithRetry(() =>
    supabase.from("settings").upsert(
      {
        user_id: userId,
        habits: store.habits,
        water_track: store.waterTrack,
        custom_stickers: store.customStickers,
        placed_stickers: store.placedStickers,
      },
      { onConflict: "user_id" }
    )
  );
  if (error) {
    console.error("Failed to save settings:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

/** Update the local cache after a successful save */
export function updateCache(userId, store) {
  cacheCloudData(userId, store);
}


