-- =============================================================================
-- SaiUConnect: Read policies for faculty directory tables (authenticated)
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Adds SELECT-only RLS policies for tables required by the Student Faculty
-- Directory and related student timetable reads.
--
-- Does NOT:
--   - modify profiles policies
--   - modify policies created in 005_add_reference_table_read_policies.sql
--   - add INSERT/UPDATE/DELETE policies
--   - grant access to anonymous users
--
-- Depends on:
--   003_create_timetable_schema.sql
--   005_add_reference_table_read_policies.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. faculty_members — active faculty only
-- -----------------------------------------------------------------------------

ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.faculty_members TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'faculty_members'
      AND policyname = 'Authenticated users can read active faculty members'
  ) THEN
    CREATE POLICY "Authenticated users can read active faculty members"
      ON public.faculty_members
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. courses — active courses only
-- -----------------------------------------------------------------------------

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.courses TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'courses'
      AND policyname = 'Authenticated users can read active courses'
  ) THEN
    CREATE POLICY "Authenticated users can read active courses"
      ON public.courses
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. timetable_entry_audiences — read-only audience targeting rows
-- -----------------------------------------------------------------------------

ALTER TABLE public.timetable_entry_audiences ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.timetable_entry_audiences TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Authenticated users can read timetable entry audiences'
  ) THEN
    CREATE POLICY "Authenticated users can read timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
