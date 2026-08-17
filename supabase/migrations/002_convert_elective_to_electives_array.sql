-- SaiUConnect: Convert single elective (text) to electives (text[])
-- Run in Supabase SQL Editor after 001_add_academic_setup_to_profiles.sql
--
-- Changes:
--   Adds `electives` as a PostgreSQL text array.
--   Migrates existing `elective` values into `electives`.
--   Drops the legacy `elective` column.
--
-- Migration rules:
--   NULL / empty / 'none' elective → '{}'
--   single elective value        → one-element array
--   existing electives column    → preserved if already populated

-- 1. Add the new array column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS electives text[] NOT NULL DEFAULT '{}';

-- 2. Migrate legacy single elective values (only when electives is still empty)
UPDATE public.profiles
SET electives = CASE
  WHEN elective IS NULL OR btrim(elective) = '' OR elective = 'none' THEN '{}'::text[]
  ELSE ARRAY[elective]::text[]
END
WHERE electives = '{}'::text[]
  AND elective IS NOT NULL
  AND btrim(elective) <> ''
  AND elective <> 'none';

-- 3. Ensure NULL electives are normalized to empty arrays
UPDATE public.profiles
SET electives = '{}'::text[]
WHERE electives IS NULL;

