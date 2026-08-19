-- =============================================================================
-- SaiUConnect: Admin catalog deactivation RPC (schools)
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Fixes admin soft-deactivate for schools when direct UPDATE is blocked by RLS
-- interaction (SELECT policy is_active = true vs post-update row visibility).
--
-- Depends on:
--   003_create_timetable_schema.sql
--   007_add_admin_write_policies.sql  (public.is_admin())
--
-- Does NOT modify migrations 007 or 008 policy definitions.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.deactivate_school(p_school_id uuid)
RETURNS public.schools
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_school public.schools;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can deactivate schools';
  END IF;

  UPDATE public.schools
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_school_id
    AND is_active = true
  RETURNING * INTO updated_school;

  IF updated_school.id IS NULL THEN
    RAISE EXCEPTION 'School not found or already inactive';
  END IF;

  RETURN updated_school;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_school(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_school(uuid) TO authenticated;
