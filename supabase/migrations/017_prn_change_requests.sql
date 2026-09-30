-- PRN Change Request Workflow
-- Students request a PRN change.
-- Admins review and approve/reject the request.
-- The actual profiles.prn value remains admin-controlled.

CREATE TABLE IF NOT EXISTS public.prn_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  student_id uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  current_prn text,
  requested_prn text NOT NULL,
  reason text NOT NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),

  reviewed_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  reviewed_at timestamptz,
  admin_note text,

  completed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent a student from having multiple pending PRN requests.
CREATE UNIQUE INDEX IF NOT EXISTS
  prn_change_requests_one_pending_per_student
ON public.prn_change_requests(student_id)
WHERE status = 'pending';

-- Helpful indexes for student/admin views.
CREATE INDEX IF NOT EXISTS
  prn_change_requests_student_id_idx
ON public.prn_change_requests(student_id);

CREATE INDEX IF NOT EXISTS
  prn_change_requests_status_idx
ON public.prn_change_requests(status);

CREATE INDEX IF NOT EXISTS
  prn_change_requests_created_at_idx
ON public.prn_change_requests(created_at DESC);


-- ------------------------------------------------------------
-- Security
-- ------------------------------------------------------------

ALTER TABLE public.prn_change_requests ENABLE ROW LEVEL SECURITY;


-- Students can see their own requests.
CREATE POLICY "Students can view own PRN change requests"
ON public.prn_change_requests
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);


-- Students can create requests only for themselves.
CREATE POLICY "Students can create own PRN change requests"
ON public.prn_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
);


-- Students must NOT be able to modify or delete requests.
-- Admin functionality will be handled separately.


-- ------------------------------------------------------------
-- Protect profiles.prn
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_student_prn_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.prn IS DISTINCT FROM NEW.prn THEN

    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only an administrator can change a student PRN';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_student_prn ON public.profiles;

CREATE TRIGGER protect_student_prn
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_student_prn_change();


-- Keep updated_at current.
CREATE OR REPLACE FUNCTION public.update_prn_change_request_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prn_change_requests_updated_at
ON public.prn_change_requests;

CREATE TRIGGER prn_change_requests_updated_at
BEFORE UPDATE ON public.prn_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_prn_change_request_timestamp();