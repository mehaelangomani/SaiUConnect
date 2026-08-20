-- SaiUConnect: Auto-create Student/Faculty profiles when an Auth user is created.
-- Does NOT store passwords. Does NOT grant admin/editor. Does NOT insert faculty catalog rows.
--
-- Does NOT modify migrations 007–012.

CREATE OR REPLACE FUNCTION public.handle_new_university_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text;
  parsed_role text;
  parsed_school text;
  parsed_name text;
  parsed_initial text;
  parsed_year text;
  local_part text;
  name_part text;
  rest_part text;
  student_match text[];
  faculty_match text[];
  existing_role text;
BEGIN
  normalized_email := lower(trim(COALESCE(NEW.email, '')));

  IF normalized_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT role
    INTO existing_role
    FROM public.profiles
   WHERE id = NEW.id;

  IF existing_role IN ('admin', 'editor') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.profiles
     WHERE id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  student_match := regexp_match(
    normalized_email,
    '^([a-z]+)\.([a-z])-([0-9]{2})@([a-z0-9]+)\.saiuniversity\.edu\.in$'
  );
  faculty_match := regexp_match(
    normalized_email,
    '^([a-z]+)\.([a-z])@saiuniversity\.edu\.in$'
  );

  IF student_match IS NOT NULL THEN
    parsed_school := upper(student_match[4]);
    IF parsed_school NOT IN ('SCDS', 'SOL', 'SAS', 'SOAI', 'SOB', 'SOT', 'SOM', 'SAHS') THEN
      RETURN NEW;
    END IF;
    parsed_role := 'student';
    parsed_name := initcap(student_match[1]);
    parsed_initial := upper(student_match[2]);
    parsed_year := student_match[3];
  ELSIF faculty_match IS NOT NULL THEN
    parsed_role := 'faculty';
    parsed_name := initcap(faculty_match[1]);
    parsed_initial := upper(faculty_match[2]);
    parsed_school := NULL;
    parsed_year := NULL;
  ELSE
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      role,
      name,
      initial,
      school,
      graduation_year,
      academic_setup_completed
    )
    VALUES (
      NEW.id,
      normalized_email,
      parsed_role,
      parsed_name,
      parsed_initial,
      parsed_school,
      parsed_year,
      false
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN undefined_column THEN
      INSERT INTO public.profiles (id, email, role, academic_setup_completed)
      VALUES (NEW.id, normalized_email, parsed_role, false)
      ON CONFLICT (id) DO NOTHING;
    WHEN OTHERS THEN
      NULL;
  END;

  IF parsed_role = 'faculty' THEN
    BEGIN
      IF (
        SELECT count(*)
          FROM public.faculty_members
         WHERE lower(email) = normalized_email
           AND is_active = true
           AND profile_id IS NULL
      ) = 1 THEN
        UPDATE public.faculty_members
           SET profile_id = NEW.id,
               updated_at = now()
         WHERE lower(email) = normalized_email
           AND is_active = true
           AND profile_id IS NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_university_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_university_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_university_auth_user();

REVOKE ALL ON FUNCTION public.handle_new_university_auth_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_university_auth_user() TO postgres, service_role;
