-- SaiUConnect: Add student academic setup fields to profiles
-- Run this in the Supabase SQL Editor (or via Supabase CLI migrations).
--
-- Changes:
--   Adds nullable academic configuration columns to the existing `profiles` table.
--   Adds `academic_setup_completed` flag (defaults to false for existing rows).
--   Ensures authenticated users can update only their own profile row (RLS).

-- 1. Add academic setup columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS minor text,
  ADD COLUMN IF NOT EXISTS elective text,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS lab_group text,
  ADD COLUMN IF NOT EXISTS academic_setup_completed boolean NOT NULL DEFAULT false;

-- 2. Optional: index for filtering students who completed setup
CREATE INDEX IF NOT EXISTS profiles_academic_setup_completed_idx
  ON public.profiles (academic_setup_completed)
  WHERE role = 'student';

-- 3. RLS — allow authenticated users to read their own profile (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- 4. RLS — allow authenticated users to update only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
