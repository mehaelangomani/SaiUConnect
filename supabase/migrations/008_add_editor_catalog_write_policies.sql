-- =============================================================================
-- SaiUConnect: Editor + catalog write policies for timetable editor
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Extends 007_add_admin_write_policies.sql with:
--   - is_editor() helper
--   - editor timetable INSERT/UPDATE (no timetable_entries DELETE)
--   - editor timetable_entry_audiences INSERT/UPDATE/DELETE
--   - editor catalog INSERT/UPDATE only (no catalog DELETE)
--   - admin catalog INSERT/UPDATE/DELETE
--   - narrow admin profile role management (other users only, role column enforced by trigger)
--   - admin-only admin_requests table
--
-- Does NOT modify migration 007.
-- Does NOT execute automatically.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: check whether the current user is an editor
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_editor()
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
      AND role = 'editor'
  );
$$;

-- -----------------------------------------------------------------------------
-- timetable_entries — editor write access (007 covers admin)
-- No DELETE policies for admin or editor on timetable_entries.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Editors can insert timetable entries'
  ) THEN
    CREATE POLICY "Editors can insert timetable entries"
      ON public.timetable_entries
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Editors can update timetable entries'
  ) THEN
    CREATE POLICY "Editors can update timetable entries"
      ON public.timetable_entries
      FOR UPDATE
      TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entries'
      AND policyname = 'Editors can read all timetable entries'
  ) THEN
    CREATE POLICY "Editors can read all timetable entries"
      ON public.timetable_entries
      FOR SELECT
      TO authenticated
      USING (public.is_editor() OR public.is_admin() OR is_published = true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- timetable_entry_audiences — editor write access (007 covers admin)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Editors can insert timetable entry audiences'
  ) THEN
    CREATE POLICY "Editors can insert timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Editors can update timetable entry audiences'
  ) THEN
    CREATE POLICY "Editors can update timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR UPDATE
      TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'timetable_entry_audiences'
      AND policyname = 'Editors can delete timetable entry audiences'
  ) THEN
    CREATE POLICY "Editors can delete timetable entry audiences"
      ON public.timetable_entry_audiences
      FOR DELETE
      TO authenticated
      USING (public.is_editor());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Catalog tables — table grants (RLS still enforces per-role access)
-- Editors: INSERT/UPDATE only
-- Admins: INSERT/UPDATE/DELETE via separate policies below
-- -----------------------------------------------------------------------------

GRANT INSERT, UPDATE ON public.schools TO authenticated;
GRANT INSERT, UPDATE ON public.courses TO authenticated;
GRANT INSERT, UPDATE ON public.faculty_members TO authenticated;
GRANT INSERT, UPDATE ON public.rooms TO authenticated;
GRANT INSERT, UPDATE ON public.time_slots TO authenticated;
GRANT DELETE ON public.schools TO authenticated;
GRANT DELETE ON public.courses TO authenticated;
GRANT DELETE ON public.faculty_members TO authenticated;
GRANT DELETE ON public.rooms TO authenticated;
GRANT DELETE ON public.time_slots TO authenticated;

-- schools ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools'
      AND policyname = 'Editors can insert schools'
  ) THEN
    CREATE POLICY "Editors can insert schools"
      ON public.schools FOR INSERT TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools'
      AND policyname = 'Editors can update schools'
  ) THEN
    CREATE POLICY "Editors can update schools"
      ON public.schools FOR UPDATE TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools'
      AND policyname = 'Admins can insert schools'
  ) THEN
    CREATE POLICY "Admins can insert schools"
      ON public.schools FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools'
      AND policyname = 'Admins can update schools'
  ) THEN
    CREATE POLICY "Admins can update schools"
      ON public.schools FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools'
      AND policyname = 'Admins can delete schools'
  ) THEN
    CREATE POLICY "Admins can delete schools"
      ON public.schools FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- courses ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'Editors can insert courses'
  ) THEN
    CREATE POLICY "Editors can insert courses"
      ON public.courses FOR INSERT TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'Editors can update courses'
  ) THEN
    CREATE POLICY "Editors can update courses"
      ON public.courses FOR UPDATE TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'Admins can insert courses'
  ) THEN
    CREATE POLICY "Admins can insert courses"
      ON public.courses FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'Admins can update courses'
  ) THEN
    CREATE POLICY "Admins can update courses"
      ON public.courses FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'Admins can delete courses'
  ) THEN
    CREATE POLICY "Admins can delete courses"
      ON public.courses FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- faculty_members -------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members'
      AND policyname = 'Editors can insert faculty members'
  ) THEN
    CREATE POLICY "Editors can insert faculty members"
      ON public.faculty_members FOR INSERT TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members'
      AND policyname = 'Editors can update faculty members'
  ) THEN
    CREATE POLICY "Editors can update faculty members"
      ON public.faculty_members FOR UPDATE TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members'
      AND policyname = 'Admins can insert faculty members'
  ) THEN
    CREATE POLICY "Admins can insert faculty members"
      ON public.faculty_members FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members'
      AND policyname = 'Admins can update faculty members'
  ) THEN
    CREATE POLICY "Admins can update faculty members"
      ON public.faculty_members FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members'
      AND policyname = 'Admins can delete faculty members'
  ) THEN
    CREATE POLICY "Admins can delete faculty members"
      ON public.faculty_members FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- rooms -----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms'
      AND policyname = 'Editors can insert rooms'
  ) THEN
    CREATE POLICY "Editors can insert rooms"
      ON public.rooms FOR INSERT TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms'
      AND policyname = 'Editors can update rooms'
  ) THEN
    CREATE POLICY "Editors can update rooms"
      ON public.rooms FOR UPDATE TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms'
      AND policyname = 'Admins can insert rooms'
  ) THEN
    CREATE POLICY "Admins can insert rooms"
      ON public.rooms FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms'
      AND policyname = 'Admins can update rooms'
  ) THEN
    CREATE POLICY "Admins can update rooms"
      ON public.rooms FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms'
      AND policyname = 'Admins can delete rooms'
  ) THEN
    CREATE POLICY "Admins can delete rooms"
      ON public.rooms FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- time_slots ------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'time_slots'
      AND policyname = 'Editors can insert time slots'
  ) THEN
    CREATE POLICY "Editors can insert time slots"
      ON public.time_slots FOR INSERT TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'time_slots'
      AND policyname = 'Editors can update time slots'
  ) THEN
    CREATE POLICY "Editors can update time slots"
      ON public.time_slots FOR UPDATE TO authenticated
      USING (public.is_editor())
      WITH CHECK (public.is_editor());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'time_slots'
      AND policyname = 'Admins can insert time slots'
  ) THEN
    CREATE POLICY "Admins can insert time slots"
      ON public.time_slots FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'time_slots'
      AND policyname = 'Admins can update time slots'
  ) THEN
    CREATE POLICY "Admins can update time slots"
      ON public.time_slots FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'time_slots'
      AND policyname = 'Admins can delete time slots'
  ) THEN
    CREATE POLICY "Admins can delete time slots"
      ON public.time_slots FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- profiles — admin role management on OTHER users only
--
-- RLS limitation: PostgreSQL row policies cannot restrict UPDATE to a single
-- column. The policy below allows admins to UPDATE other users' profile rows.
-- A BEFORE UPDATE trigger enforces that only `role` may change on those rows.
-- Admins updating their own profile still use migration 001's own-profile policy.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_admin_profile_role_only_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() AND OLD.id IS DISTINCT FROM auth.uid() THEN
    NEW.id := OLD.id;
    NEW.email := OLD.email;
    NEW.name := OLD.name;
    NEW.school := OLD.school;
    NEW.graduation_year := OLD.graduation_year;
    NEW.initial := OLD.initial;
    NEW.academic_year := OLD.academic_year;
    NEW.semester := OLD.semester;
    NEW.minor := OLD.minor;
    NEW.electives := OLD.electives;
    NEW.section := OLD.section;
    NEW.lab_group := OLD.lab_group;
    NEW.academic_setup_completed := OLD.academic_setup_completed;
    -- NEW.role is intentionally left as submitted (appoint admin / remove editor).
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_admin_profile_role_only_update ON public.profiles;

CREATE TRIGGER trg_enforce_admin_profile_role_only_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_profile_role_only_update();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Admins can update other users profile roles'
  ) THEN
    CREATE POLICY "Admins can update other users profile roles"
      ON public.profiles FOR UPDATE TO authenticated
      USING (public.is_admin() AND id <> auth.uid())
      WITH CHECK (public.is_admin() AND id <> auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- admin_requests — admin-only (editors, students, faculty have no access)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_by   uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_requests TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_requests'
      AND policyname = 'Admins can select admin requests'
  ) THEN
    CREATE POLICY "Admins can select admin requests"
      ON public.admin_requests FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_requests'
      AND policyname = 'Admins can insert admin requests'
  ) THEN
    CREATE POLICY "Admins can insert admin requests"
      ON public.admin_requests FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_requests'
      AND policyname = 'Admins can update admin requests'
  ) THEN
    CREATE POLICY "Admins can update admin requests"
      ON public.admin_requests FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_requests'
      AND policyname = 'Admins can delete admin requests'
  ) THEN
    CREATE POLICY "Admins can delete admin requests"
      ON public.admin_requests FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
