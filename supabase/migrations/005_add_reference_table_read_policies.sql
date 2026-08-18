-- =============================================================================
-- SaiUConnect: Read policies for reference/timetable tables (authenticated)
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Enables RLS and grants SELECT-only access to authenticated users for
-- catalog/reference data and published timetable entries.
--
-- Does NOT:
--   - modify profiles policies
--   - add INSERT/UPDATE/DELETE policies
--   - grant access to anonymous users
--   - implement student audience matching in RLS (handled in application code)
--
-- Depends on:
--   003_create_timetable_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. schools — active schools only
-- -----------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.schools TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'schools'
      AND policyname = 'Authenticated users can read active schools'
  ) THEN
    CREATE POLICY "Authenticated users can read active schools"
      ON public.schools
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. academic_terms — active terms only
-- -----------------------------------------------------------------------------

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.academic_terms TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'academic_terms'
      AND policyname = 'Authenticated users can read active academic terms'
  ) THEN
    CREATE POLICY "Authenticated users can read active academic terms"
      ON public.academic_terms
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. sections — catalog reference data
-- -----------------------------------------------------------------------------

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.sections TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sections'
      AND policyname = 'Authenticated users can read sections'
  ) THEN
    CREATE POLICY "Authenticated users can read sections"
      ON public.sections
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. lab_groups — catalog reference data
-- -----------------------------------------------------------------------------

ALTER TABLE public.lab_groups ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.lab_groups TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lab_groups'
      AND policyname = 'Authenticated users can read lab groups'
  ) THEN
    CREATE POLICY "Authenticated users can read lab groups"
      ON public.lab_groups
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. time_slots — schedule period definitions
-- -----------------------------------------------------------------------------

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.time_slots TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'time_slots'
      AND policyname = 'Authenticated users can read time slots'
  ) THEN
    CREATE POLICY "Authenticated users can read time slots"
      ON public.time_slots
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. rooms — active rooms only (availability filtered in application code)
-- -----------------------------------------------------------------------------

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.rooms TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rooms'
      AND policyname = 'Authenticated users can read active rooms'
  ) THEN
    CREATE POLICY "Authenticated users can read active rooms"
      ON public.rooms
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. timetable_entries — published entries only
-- -----------------------------------------------------------------------------

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.timetable_entries TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Authenticated users can read published timetable entries'
  ) THEN
    CREATE POLICY "Authenticated users can read published timetable entries"
      ON public.timetable_entries
      FOR SELECT
      TO authenticated
      USING (is_published = true);
  END IF;
END $$;
