-- =============================================================================
-- SaiUConnect: Faculty deactivation RPC + sections catalog support
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Adds:
--   - public.deactivate_faculty_member(uuid) SECURITY DEFINER RPC
--   - sections.is_active / sections.updated_at columns
--   - admin/editor INSERT policies on sections
--   - public.deactivate_section(uuid) SECURITY DEFINER RPC
--
-- Does NOT modify migrations 007–010 or deactivate_school.
--
-- Depends on:
--   003_create_timetable_schema.sql
--   007_add_admin_write_policies.sql  (public.is_admin())
--   008_add_editor_catalog_write_policies.sql  (public.is_editor())
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Faculty soft-deactivate RPC (mirrors deactivate_school pattern)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deactivate_faculty_member(p_faculty_id uuid)
RETURNS public.faculty_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_faculty public.faculty_members;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can deactivate faculty members';
  END IF;

  UPDATE public.faculty_members
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_faculty_id
    AND is_active = true
  RETURNING * INTO updated_faculty;

  IF updated_faculty.id IS NULL THEN
    RAISE EXCEPTION 'Faculty member not found or already inactive';
  END IF;

  RETURN updated_faculty;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_faculty_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_faculty_member(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- Sections catalog: soft-deactivate support
-- -----------------------------------------------------------------------------

ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT INSERT, UPDATE ON public.sections TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sections'
      AND policyname = 'Admins can insert sections'
  ) THEN
    CREATE POLICY "Admins can insert sections"
      ON public.sections
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
      AND tablename = 'sections'
      AND policyname = 'Editors can insert sections'
  ) THEN
    CREATE POLICY "Editors can insert sections"
      ON public.sections
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_editor());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.deactivate_section(p_section_id uuid)
RETURNS public.sections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_section public.sections;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can deactivate sections';
  END IF;

  UPDATE public.sections
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_section_id
    AND is_active = true
  RETURNING * INTO updated_section;

  IF updated_section.id IS NULL THEN
    RAISE EXCEPTION 'Section not found or already inactive';
  END IF;

  RETURN updated_section;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_section(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_section(uuid) TO authenticated;
