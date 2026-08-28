/* ========================================
   CLOUD STORE — Supabase-backed persistence
   Same API as the localStorage store,
   but data lives per-user in the cloud.
   ======================================== */
import { supabase } from "./supabase";
import { uid, fmtDate } from "../store";

// ── Helpers ──────────────────────────────────────────────

// ── Public API ───────────────────────────────────────────

/** Load all user data from Supabase */
export async function loadCloudStore(userId) {
  // Load weeks — if this fails, fall back to empty
  let weeks = {};
  try {
    const { data: weekRows } = await supabase
      .from("weeks")
      .select("*")
      .eq("user_id", userId);

    if (weekRows) {
      for (const row of weekRows) {
        weeks[row.week_start] = {
          days: row.days_data,
        };
      }
    }
  } catch (e) {
    console.error("Failed to load weeks:", e);
  }

  // Load settings (todoCard, habits, waterTrack, stickers, etc.)
  // Use maybeSingle() instead of single() — .single() throws on 0 rows
  let settings = null;
  try {
    const result = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    settings = result.data;
  } catch (e) {
    console.error("Failed to load settings:", e);
  }

  return {
    weeks,
    todoCard: settings?.todo_card || {
      title: "app-plan todo",
      items: [],
    },
    habits: settings?.habits || [],
    waterTrack: settings?.water_track || {},
    customStickers: settings?.custom_stickers || [],
    placedStickers: settings?.placed_stickers || [],
  };
}

/** Save a single week to Supabase */
export async function saveWeek(userId, weekStart, weekData) {
  const { error } = await supabase.from("weeks").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      days_data: weekData.days,
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
      todo_card: store.todoCard,
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

  const todoCard = {
    title: "app-plan todo",
    items: [
      { id: uid(), text: "try claude design for icons", checked: true },
      { id: uid(), text: "check system design", checked: false },
      { id: uid(), text: "resize images", checked: false },
      { id: uid(), text: "make a to-do list for first alpha release testing", checked: false },
      { id: uid(), text: "look into background removal", checked: false },
      { id: uid(), text: "check the action videos", checked: false },
    ],
  };

  const { error } = await supabase.from("settings").insert({
    user_id: userId,
    todo_card: todoCard,
    habits,
    water_track: { [fmtDate(new Date())]: 1.8 },
    custom_stickers: [],
    placed_stickers: [],
  });

  if (error) console.error("Failed to create default settings:", error);
}
