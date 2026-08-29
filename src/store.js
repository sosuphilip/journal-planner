/* ========================================
   DATA STORE — localStorage persistence layer
   Structure mirrors what could become a backend API.
   All reads/writes go through helpers here.
   ======================================== */

const STORAGE_KEY = "planner-data";

// ── Helpers ──────────────────────────────────────────────

/** Get Monday of the ISO week containing a given date */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format date as YYYY-MM-DD */
export function fmtDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Format date nicely for display, e.g. "Aug 17" */
export function fmtShortDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Get ISO week number */
export function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Generate a unique ID */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Read full store from localStorage */
export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Write full store to localStorage */
export function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Default week template (blank) ────────────────────────

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function blankWeek(weekStartStr) {
  const start = new Date(weekStartStr + "T00:00:00");
  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      date: fmtDate(d),
      dayLabel: label,
      checklistItems: [],
      journalText: "",
      journalMood: "",
      musicNote: { line1: "", line2: "" },
      specialNote: "",
      dateCircled: false,
      dateSticker: null,
      placedStickers: [],
    };
  });

  return { days };
}

// ── Seed data for week 2026-08-17 ────────────────────────

function createSeedData() {
  const weekKey = "2026-08-17";
  const week = blankWeek(weekKey);

  // Day 17 Mon
  week.days[0].checklistItems = [
    { id: uid(), text: "skincare", checked: true },
    { id: uid(), text: "2l water", checked: false },
    { id: uid(), text: "meds", checked: false },
    { id: uid(), text: "gym", checked: false },
  ];

  // Day 18 Tue
  week.days[1].checklistItems = [
    { id: uid(), text: "clean gym clothes", checked: true },
    { id: uid(), text: "do bookkeeping", checked: false },
    { id: uid(), text: "backup videos", checked: false },
  ];

  // Day 19 Wed
  week.days[2].checklistItems = [
    { id: uid(), text: "take apart desk", checked: true },
    { id: uid(), text: "meds", checked: false },
    { id: uid(), text: "study for exam", checked: false },
    { id: uid(), text: "aripiprazole", checked: false },
  ];

  // Day 20 Thu
  week.days[3].checklistItems = [
    { id: uid(), text: "prep 3d printer material", checked: true },
    { id: uid(), text: "5:30pm meeting with team", checked: false },
    { id: uid(), text: "9:30pm meeting with client", checked: false },
    { id: uid(), text: "aripiprazole", checked: false },
  ];

  // Day 21 Fri (circled)
  week.days[4].dateCircled = true;
  week.days[4].checklistItems = [
    // left sub-list (plain, no checkboxes - stored with isNote: true)
    { id: uid(), text: "review meeting with gym trainer", checked: false, isNote: true },
    { id: uid(), text: "app code review", checked: false, isNote: true },
    // right sub-list (checkboxes)
    { id: uid(), text: "study for exam", checked: false },
    { id: uid(), text: "app planning", checked: false },
    { id: uid(), text: "app dev work", checked: false },
  ];

  // Day 22 Sat (star sticker + special note)
  week.days[5].dateSticker = "star";
  week.days[5].specialNote = "going to watch spiderman!!";

  // Day 23 Sun — empty

  // Per-day journal entries
  week.days[0].journalText = "i woke up at 5:02am with energy 🤩\n\nmid energy around 6:02pm, maybe because i took my medication";
  week.days[0].journalMood = "energy: high in the morning";
  week.days[0].musicNote = { line1: "listened to a lot of lo-fi", line2: "study beats playlist" };

  week.days[1].journalText = "cleaned gym clothes right after getting home! small win 🎉";
  week.days[1].journalMood = "mood: productive";
  week.days[1].musicNote = { line1: "listened to pop hits", line2: "daily mix" };

  week.days[2].journalText = "took apart the desk today. also studied for the exam.";
  week.days[2].journalMood = "calories intake: not a lot :(";
  week.days[2].musicNote = { line1: "listened to podcast", line2: "tech news daily" };

  week.days[3].journalText = "busy day with meetings. prep 3d printer material done.";
  week.days[3].journalMood = "energy: tired but okay";
  week.days[3].musicNote = { line1: "listened to ambient sounds", line2: "focus playlist" };

  week.days[4].journalText = "friday! review meeting done, got a lot of planning done for the app.";
  week.days[4].journalMood = "mood: excited for the weekend";
  week.days[4].musicNote = { line1: "listened to indie rock", line2: "weekend vibes" };

  week.days[5].journalText = "going to watch spiderman!! 🕷️";
  week.days[5].journalMood = "mood: excited";
  week.days[5].musicNote = { line1: "listened to movie soundtrack", line2: "spiderman theme" };

  week.days[6].journalText = "";
  week.days[6].journalMood = "";
  week.days[6].musicNote = { line1: "", line2: "" };

  // Todo card
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

  // Habits
  const habits = [
    { id: uid(), name: "dance", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "gym", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "stretch", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "game", days: [false, false, false, false, false, false, false] },
    { id: uid(), name: "calisthenics", days: [false, false, false, false, false, false, false] },
  ];

  // Water track
  const waterTrack = {
    "2026-08-17": 1.8,
  };

  return {
    weeks: { [weekKey]: week },
    todoCard,
    habits,
    waterTrack,
    customStickers: [],
    placedStickers: [],
  };
}

// ── Public API ───────────────────────────────────────────

/** Initialize store — returns existing or seeded data */
export function initStore() {
  let data = loadStore();
  if (!data) {
    data = createSeedData();
    saveStore(data);
  }
  return data;
}

/** Get week data for a given ISO date string */
export function getWeek(store, weekStartStr) {
  if (!store.weeks[weekStartStr]) {
    store.weeks[weekStartStr] = blankWeek(weekStartStr);
  }
  return store.weeks[weekStartStr];
}

/** Get today's ISO date string */
export function todayStr() {
  return fmtDate(new Date());
}

/** Get the ISO date string for the Monday of the current week */
export function currentWeekStart() {
  return fmtDate(getWeekStart(new Date()));
}

/** Navigate prev/next week */
export function adjacentWeek(weekStartStr, direction) {
  const d = new Date(weekStartStr + "T00:00:00");
  d.setDate(d.getDate() + direction * 7);
  return fmtDate(d);
}

/** Get month name + year from week start */
export function monthYearLabel(weekStartStr) {
  const d = new Date(weekStartStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Count of week within year */
export function weekNumLabel(weekStartStr) {
  return getWeekNumber(new Date(weekStartStr + "T00:00:00"));
}
