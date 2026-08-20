-- SaiUConnect: Faculty editor-access requests
-- Reuses public.admin_requests and profiles.role.
-- Faculty cannot self-promote; only admin RPC can set role = editor.

ALTER TABLE public.admin_requests
  DROP CONSTRAINT IF EXISTS admin_requests_status_check;

ALTER TABLE public.admin_requests
  ADD CONSTRAINT admin_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS admin_requests_one_pending_editor_access
  ON public.admin_requests (created_by)
  WHERE request_type = 'editor_access'
    AND status = 'pending'
    AND created_by IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_requests'
      AND policyname = 'Faculty can select own editor access requests'
  ) THEN
    CREATE POLICY "Faculty can select own editor access requests"
      ON public.admin_requests FOR SELECT TO authenticated
      USING (
        created_by = auth.uid()
        AND request_type = 'editor_access'
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title               text NOT NULL,
  message             text NOT NULL,
  notification_type   text NOT NULL,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read             boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_notifications_recipient_idx
  ON public.user_notifications (recipient_id, created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notifications'
      AND policyname = 'Users can select own notifications'
  ) THEN
    CREATE POLICY "Users can select own notifications"
      ON public.user_notifications FOR SELECT TO authenticated
      USING (recipient_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notifications'
      AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.user_notifications FOR UPDATE TO authenticated
      USING (recipient_id = auth.uid())
      WITH CHECK (recipient_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.request_editor_access()
RETURNS public.admin_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_request public.admin_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;

  IF v_profile.role IS DISTINCT FROM 'faculty' THEN
    RAISE EXCEPTION 'Only faculty can request editor access.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_requests
    WHERE created_by = auth.uid()
      AND request_type = 'editor_access'
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending editor request.';
  END IF;

  INSERT INTO public.admin_requests (
    request_type,
    payload,
    status,
    created_by
  )
  VALUES (
    'editor_access',
    jsonb_build_object(
      'name', COALESCE(v_profile.name, v_profile.email),
      'email', v_profile.email,
      'requester_id', v_profile.id
    ),
    'pending',
    v_profile.id
  )
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_editor_access_request(
  p_request_id uuid,
  p_decision text
)
RETURNS public.admin_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.admin_requests%ROWTYPE;
  v_faculty_id uuid;
  v_faculty_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can review editor requests.';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected.';
  END IF;

  SELECT * INTO v_request
  FROM public.admin_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found.';
  END IF;

  IF v_request.request_type IS DISTINCT FROM 'editor_access' THEN
    RAISE EXCEPTION 'This is not an editor access request.';
  END IF;

  IF v_request.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This request has already been reviewed.';
  END IF;

  v_faculty_id := COALESCE(
    v_request.created_by,
    NULLIF(v_request.payload->>'requester_id', '')::uuid
  );

  IF v_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Request is missing a faculty requester.';
  END IF;

  UPDATE public.admin_requests
  SET
    status = p_decision,
    updated_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  SELECT COALESCE(name, email) INTO v_faculty_name
  FROM public.profiles
  WHERE id = v_faculty_id;

  IF p_decision = 'approved' THEN
    UPDATE public.profiles
    SET role = 'editor'
    WHERE id = v_faculty_id
      AND role = 'faculty';

    INSERT INTO public.user_notifications (
      recipient_id,
      title,
      message,
      notification_type,
      payload
    )
    VALUES (
      v_faculty_id,
      'Editor request approved',
      'Your request to become an editor has been approved.',
      'editor_request_approved',
      jsonb_build_object('request_id', p_request_id)
    );
  ELSE
    INSERT INTO public.user_notifications (
      recipient_id,
      title,
      message,
      notification_type,
      payload
    )
    VALUES (
      v_faculty_id,
      'Editor request rejected',
      'Your request to become an editor was rejected. You can submit a new request later.',
      'editor_request_rejected',
      jsonb_build_object('request_id', p_request_id)
    );
  END IF;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.request_editor_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_editor_access_request(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_editor_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_editor_access_request(uuid, text) TO authenticated;
