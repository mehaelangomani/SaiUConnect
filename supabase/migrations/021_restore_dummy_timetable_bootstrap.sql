-- =============================================================================
-- SaiUConnect: Restore dummy catalogue + seed Admin Timetable Editor cells
-- =============================================================================
--
-- Idempotent. Safe to re-run. Does NOT drop or truncate data.
-- Does NOT recreate Marks objects or migrations 018–020.
--
-- Why this is an RPC:
--   faculty_members / courses SELECT policies only expose is_active = true rows.
--   Inactive dummy rows therefore cannot be reactivated from the browser client.
--
-- Depends on: 003 timetable schema, 007 is_admin(), 008 is_editor()
-- =============================================================================

-- Leftover Marks 020 trigger uses min(uuid), which blocks faculty upserts.
DROP TRIGGER IF EXISTS trg_link_faculty_member_to_profile ON public.faculty_members;

CREATE OR REPLACE FUNCTION public.ensure_dummy_timetable_bootstrap()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid;
  v_term_id uuid;
  v_created integer := 0;
  v_faculty_upserted integer := 0;
  v_courses_upserted integer := 0;
  v_course_id uuid;
  v_faculty_id uuid;
  v_room_id uuid;
  v_slot_id uuid;
  v_entry_id uuid;
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
  ELSIF NOT (public.is_admin() OR public.is_editor()) THEN
    RAISE EXCEPTION 'Only admins or editors can bootstrap dummy timetable data';
  END IF;

  SELECT id
    INTO v_school_id
    FROM public.schools
   WHERE code = 'SCDS'
     AND is_active = true
   LIMIT 1;

  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'SCDS school is missing or inactive';
  END IF;

  SELECT id
    INTO v_term_id
    FROM public.academic_terms
   WHERE is_active = true
   ORDER BY academic_year_code DESC
   LIMIT 1;

  IF v_term_id IS NULL THEN
    RAISE EXCEPTION 'No active academic term is configured';
  END IF;

  -- Dummy faculty: reuse by email, never overwrite profile_id
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('Dr. Dummy Alpha',   'dummy.alpha@test.saiuconnect.invalid',   'DA'),
        ('Dr. Dummy Beta',    'dummy.beta@test.saiuconnect.invalid',    'DB'),
        ('Dr. Dummy Gamma',   'dummy.gamma@test.saiuconnect.invalid',   'DG'),
        ('Dr. Dummy Delta',   'dummy.delta@test.saiuconnect.invalid',   'DD'),
        ('Dr. Dummy Epsilon', 'dummy.epsilon@test.saiuconnect.invalid', 'DE'),
        ('Dr. Dummy Jane',    'dummy.jane@test.saiuconnect.invalid',    'DJ')
    ) AS f(name, email, initial)
  LOOP
    INSERT INTO public.faculty_members (name, email, initial, school_id, is_active)
    VALUES (rec.name, rec.email, rec.initial, v_school_id, true)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          initial = EXCLUDED.initial,
          is_active = true,
          school_id = COALESCE(public.faculty_members.school_id, EXCLUDED.school_id),
          updated_at = now();

    v_faculty_upserted := v_faculty_upserted + 1;
  END LOOP;

  -- Dummy SCDS courses: reuse by (school_id, code)
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('CS201',  'Data Structures',                 'core'::public.course_category),
        ('CS202',  'Programming in Python',           'core'::public.course_category),
        ('CS203',  'Database Management Systems',     'core'::public.course_category),
        ('CS204',  'Data Structures Lab',             'lab'::public.course_category),
        ('CY301',  'Cyber Security',                  'elective'::public.course_category),
        ('ML301',  'Machine Learning',                'elective'::public.course_category),
        ('ECO301', 'Economics for Computing',         'minor'::public.course_category)
    ) AS c(code, name, category)
  LOOP
    INSERT INTO public.courses (school_id, code, name, category, is_active)
    VALUES (v_school_id, rec.code, rec.name, rec.category, true)
    ON CONFLICT (school_id, code) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          is_active = true,
          updated_at = now();

    v_courses_upserted := v_courses_upserted + 1;
  END LOOP;

  -- Seed published SCDS cells on the ACTIVE term, matching existing time slots.
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        -- Monday
        (1, '09:15:00'::time, 'CS201',  'dummy.alpha@test.saiuconnect.invalid',   'AB1 101',          '1'),
        (1, '10:15:00'::time, 'CS202',  'dummy.beta@test.saiuconnect.invalid',    'AB1 102',          '1'),
        (1, '11:15:00'::time, 'CS203',  'dummy.gamma@test.saiuconnect.invalid',   'AB1 103',          '1'),
        (1, '14:00:00'::time, 'CS204',  'dummy.delta@test.saiuconnect.invalid',   'AB1 Computer Lab', '1'),
        -- Tuesday
        (2, '09:15:00'::time, 'CS202',  'dummy.beta@test.saiuconnect.invalid',    'AB1 102',          '2'),
        (2, '10:15:00'::time, 'CS201',  'dummy.alpha@test.saiuconnect.invalid',   'AB1 101',          '2'),
        (2, '11:15:00'::time, 'CY301',  'dummy.epsilon@test.saiuconnect.invalid', 'AB1 201',          '1'),
        (2, '14:00:00'::time, 'ML301',  'dummy.gamma@test.saiuconnect.invalid',   'AB2 202',          '1'),
        -- Wednesday
        (3, '09:15:00'::time, 'CS203',  'dummy.gamma@test.saiuconnect.invalid',   'AB1 103',          '2'),
        (3, '10:15:00'::time, 'CS201',  'dummy.alpha@test.saiuconnect.invalid',   'AB1 101',          '3'),
        (3, '11:15:00'::time, 'CS202',  'dummy.beta@test.saiuconnect.invalid',    'AB1 102',          '3'),
        (3, '14:00:00'::time, 'ECO301', 'dummy.jane@test.saiuconnect.invalid',    'AB2 203',          '1'),
        -- Thursday
        (4, '09:15:00'::time, 'CS204',  'dummy.delta@test.saiuconnect.invalid',   'AB1 Computer Lab', '2'),
        (4, '10:15:00'::time, 'CY301',  'dummy.epsilon@test.saiuconnect.invalid', 'AB1 201',          '2'),
        (4, '11:15:00'::time, 'ML301',  'dummy.gamma@test.saiuconnect.invalid',   'AB2 202',          '2'),
        (4, '14:00:00'::time, 'CS203',  'dummy.gamma@test.saiuconnect.invalid',   'AB1 103',          '3'),
        -- Friday
        (5, '09:15:00'::time, 'CS201',  'dummy.alpha@test.saiuconnect.invalid',   'AB1 101',          '4'),
        (5, '10:15:00'::time, 'CS202',  'dummy.beta@test.saiuconnect.invalid',    'AB1 102',          '4'),
        (5, '11:15:00'::time, 'CS203',  'dummy.gamma@test.saiuconnect.invalid',   'AB1 103',          '4'),
        (5, '14:00:00'::time, 'ECO301', 'dummy.jane@test.saiuconnect.invalid',    'AB2 203',          '2')
    ) AS plan(day_of_week, start_time, course_code, faculty_email, room_code, section_code)
  LOOP
    SELECT c.id
      INTO v_course_id
      FROM public.courses c
     WHERE c.school_id = v_school_id
       AND c.code = rec.course_code
     LIMIT 1;

    SELECT fm.id
      INTO v_faculty_id
      FROM public.faculty_members fm
     WHERE lower(fm.email) = rec.faculty_email
     LIMIT 1;

    SELECT r.id
      INTO v_room_id
      FROM public.rooms r
     WHERE r.code = rec.room_code
       AND r.is_active = true
     LIMIT 1;

    SELECT ts.id
      INTO v_slot_id
      FROM public.time_slots ts
     WHERE ts.day_of_week = rec.day_of_week
       AND ts.start_time = rec.start_time
     ORDER BY ts.end_time
     LIMIT 1;

    IF v_course_id IS NULL OR v_faculty_id IS NULL OR v_room_id IS NULL OR v_slot_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT te.id
      INTO v_entry_id
      FROM public.timetable_entries te
     WHERE te.academic_term_id = v_term_id
       AND te.room_id = v_room_id
       AND te.time_slot_id = v_slot_id
     LIMIT 1;

    IF v_entry_id IS NOT NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.timetable_entries (
      academic_term_id,
      school_id,
      course_id,
      faculty_member_id,
      room_id,
      time_slot_id,
      year,
      notes,
      is_published
    )
    VALUES (
      v_term_id,
      v_school_id,
      v_course_id,
      v_faculty_id,
      v_room_id,
      v_slot_id,
      'year-2',
      'dummy-scds-bootstrap',
      true
    )
    RETURNING id INTO v_entry_id;

    INSERT INTO public.timetable_entry_audiences (
      timetable_entry_id,
      audience_type,
      audience_code
    )
    VALUES (
      v_entry_id,
      'section',
      rec.section_code
    )
    ON CONFLICT (timetable_entry_id, audience_type, audience_code) DO NOTHING;

    v_created := v_created + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'school', 'SCDS',
    'facultyUpserted', v_faculty_upserted,
    'coursesUpserted', v_courses_upserted,
    'entriesCreated', v_created
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_dummy_timetable_bootstrap() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_dummy_timetable_bootstrap() TO authenticated;
