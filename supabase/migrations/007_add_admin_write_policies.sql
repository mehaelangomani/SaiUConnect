-- =============================================================================
-- SaiUConnect: Admin write policies for timetable management
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Grants admin users (profiles.role = 'admin') the ability to:
--   - read all timetable entries (including drafts)
--   - insert/update timetable entries
--   - manage timetable entry audiences
--
-- Does NOT:
--   - weaken existing student read policies
--   - grant write access to non-admin authenticated users
--   - modify profiles policies
--
-- Depends on:
--   003_create_timetable_schema.sql
--   005_add_reference_table_read_policies.sql
--   006_add_faculty_course_read_policies.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: check whether the current user is an admin
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- timetable_entries — admin read (drafts), insert, update
-- -----------------------------------------------------------------------------

GRANT INSERT, UPDATE ON public.timetable_entries TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Admins can read all timetable entries'
  ) THEN
    CREATE POLICY "Admins can read all timetable entries"
      ON public.timetable_entries
      FOR SELECT
      TO authenticated
      USING (public.is_admin() OR is_published = true);
  END IF;
END $$;

-- Replace the student-only read policy with the combined policy above.
-- If the old policy still exists alongside this one, both are OR'd — drafts remain
-- hidden from students because is_published = true is required for non-admins.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Admins can insert timetable entries'
  ) THEN
    CREATE POLICY "Admins can insert timetable entries"
      ON public.timetable_entries
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Admins can update timetable entries'
  ) THEN
    CREATE POLICY "Admins can update timetable entries"
      ON public.timetable_entries
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- timetable_entry_audiences — admin insert, update, delete
-- -----------------------------------------------------------------------------

GRANT INSERT, UPDATE, DELETE ON public.timetable_entry_audiences TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Admins can insert timetable entry audiences'
  ) THEN
    CREATE POLICY "Admins can insert timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Admins can update timetable entry audiences'
  ) THEN
    CREATE POLICY "Admins can update timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Admins can delete timetable entry audiences'
  ) THEN
    CREATE POLICY "Admins can delete timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
