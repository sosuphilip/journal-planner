/* ========================================
   CLOUD STORE — Supabase-backed persistence
   Same API as the localStorage store,
   but data lives per-user in the cloud.
   ======================================== */
import { supabase } from "./supabase";
import { uid, fmtDate } from "../store";

// ── Helpers ──────────────────────────────────────────────

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
  // Run both queries in parallel instead of sequentially
  const [weeksResult, settingsResult] = await Promise.allSettled([
    supabase.from("weeks").select("*").eq("user_id", userId),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  // Parse weeks
  let weeks = {};
  if (weeksResult.status === "fulfilled" && weeksResult.value.data) {
    for (const row of weeksResult.value.data) {
      weeks[row.week_start] = { days: row.days_data, habits: row.habits_data || [], todoCard: row.todo_card || { title: "todo list", items: [] } };
    }
  }

  // Parse settings
  const settings =
    settingsResult.status === "fulfilled" ? settingsResult.value.data : null;

  const cloudData = {
    weeks,
    habits: settings?.habits || [],
    waterTrack: settings?.water_track || {},
    customStickers: settings?.custom_stickers || [],
    placedStickers: settings?.placed_stickers || [],
  };

  // Cache to localStorage for instant load next time
  cacheCloudData(userId, cloudData);

  return cloudData;
}

/** Load from cache instantly (synchronous, no network) */
export function loadCachedCloudStore(userId) {
  return loadCachedData(userId);
}

/** Save a single week to Supabase */
export async function saveWeek(userId, weekStart, weekData) {
  const { error } = await supabase.from("weeks").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      days_data: weekData.days,
      habits_data: weekData.habits || [],
      todo_card: weekData.todoCard || {},
    },
    { onConflict: "user_id,week_start" }
  );
  if (error) console.error("Failed to save week:", error);
}

/** Save settings to Supabase */
export async function saveSettings(userId, store) {
  const { error } = await supabase.from("settings").upsert(
    {
      user_id: userId,
      habits: store.habits,
      water_track: store.waterTrack,
      custom_stickers: store.customStickers,
      placed_stickers: store.placedStickers,
    },
    { onConflict: "user_id" }
  );
  if (error) console.error("Failed to save settings:", error);
}

/** Create default settings for a new user */
export async function createDefaultSettings(userId) {
  const habits = [
    { id: uid(), name: "dance", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "gym", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "stretch", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "game", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "calisthenics", days: [false, false, false, false, false, false, false] },
  ];

  const { error } = await supabase.from("settings").insert({
    user_id: userId,
    habits,
    water_track: { [fmtDate(new Date())]: 1.8 },
    custom_stickers: [],
    placed_stickers: [],
  });

  if (error) console.error("Failed to create default settings:", error);
}
