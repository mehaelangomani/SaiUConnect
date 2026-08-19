-- =============================================================================
-- SaiUConnect: Admin catalog deactivation RPC (rooms)
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — apply manually in Supabase when ready
--
-- Fixes admin soft-deactivate for rooms when direct UPDATE is blocked by RLS
-- interaction (SELECT policy is_active = true vs post-update row visibility).
--
-- Depends on:
--   003_create_timetable_schema.sql
--   007_add_admin_write_policies.sql  (public.is_admin())
--
-- Does NOT modify migrations 007–011.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.deactivate_room(p_room_id uuid)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_room public.rooms;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can deactivate rooms';
  END IF;

  UPDATE public.rooms
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_room_id
    AND is_active = true
  RETURNING * INTO updated_room;

  IF updated_room.id IS NULL THEN
    RAISE EXCEPTION 'Room not found or already inactive';
  END IF;

  RETURN updated_room;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_room(uuid) TO authenticated;
