-- =============================================
-- JOURNAL PLANNER — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Weeks table: stores weekly planner data per user
CREATE TABLE IF NOT EXISTS weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  days_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Settings table: stores user settings (todo card, habits, water, stickers)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  todo_card JSONB DEFAULT '{}'::jsonb,
  habits JSONB DEFAULT '[]'::jsonb,
  water_track JSONB DEFAULT '{}'::jsonb,
  custom_stickers JSONB DEFAULT '[]'::jsonb,
  placed_stickers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW-LEVEL SECURITY (RLS)
-- Users can ONLY access their own data
-- =============================================

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Weeks: users can only read/write their own weeks
CREATE POLICY "Users can read own weeks"
  ON weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weeks"
  ON weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weeks"
  ON weeks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weeks"
  ON weeks FOR DELETE
  USING (auth.uid() = user_id);

-- Settings: users can only read/write their own settings
CREATE POLICY "Users can read own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Auto-update updated_at timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weeks_updated_at
  BEFORE UPDATE ON weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
