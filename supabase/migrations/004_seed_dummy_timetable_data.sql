-- =============================================================================
-- SaiUConnect Timetable — DUMMY / TEST SEED DATA
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — FOR MANUAL RUN ONLY
--
-- Inserts clearly labeled placeholder data for local/staging timetable testing.
-- Does NOT modify the `profiles` table or any existing schema.
-- Does NOT add RLS policies.
--
-- Depends on:
--   003_create_timetable_schema.sql
--
-- Idempotency:
--   Uses ON CONFLICT on natural unique keys and fixed seed UUIDs where helpful.
--   Safe to run once; re-running should not duplicate rows.
--
-- Test student profile alignment (manual — not applied by this migration):
--   school:        test-school
--   academic_year: year-2
--   semester:      spring-2026
--   section:       section-a
--   lab_group:     lab-1
--   minor:         economics
--   electives:     {ml, cyber-security}   -- audience codes used below
--
-- day_of_week convention: 0 = Sunday … 6 = Saturday (Mon = 1 … Fri = 5)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SCHOOLS (1)
-- -----------------------------------------------------------------------------

INSERT INTO public.schools (id, code, name)
VALUES (
  'd0000001-0000-4000-8000-000000000001',
  'test-school',
  'Test School'
)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- ACADEMIC TERMS (1)
-- -----------------------------------------------------------------------------

INSERT INTO public.academic_terms (
  id,
  academic_year_code,
  semester_code,
  label
)
VALUES (
  'd0000001-0000-4000-8000-000000000002',
  'year-2',
  'spring-2026',
  'Spring 2026 - Year 2'
)
ON CONFLICT (academic_year_code, semester_code) DO UPDATE
  SET label = EXCLUDED.label,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- SECTIONS (7): section-a … section-g
-- -----------------------------------------------------------------------------

INSERT INTO public.sections (id, code, label)
VALUES
  ('d0000002-0000-4000-8000-000000000001', 'section-a', 'Section A (Dummy)'),
  ('d0000002-0000-4000-8000-000000000002', 'section-b', 'Section B (Dummy)'),
  ('d0000002-0000-4000-8000-000000000003', 'section-c', 'Section C (Dummy)'),
  ('d0000002-0000-4000-8000-000000000004', 'section-d', 'Section D (Dummy)'),
  ('d0000002-0000-4000-8000-000000000005', 'section-e', 'Section E (Dummy)'),
  ('d0000002-0000-4000-8000-000000000006', 'section-f', 'Section F (Dummy)'),
  ('d0000002-0000-4000-8000-000000000007', 'section-g', 'Section G (Dummy)')
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label;

-- -----------------------------------------------------------------------------
-- LAB GROUPS (7): lab-1 … lab-7
-- -----------------------------------------------------------------------------

INSERT INTO public.lab_groups (id, code, label)
VALUES
  ('d0000003-0000-4000-8000-000000000001', 'lab-1', 'Lab Group 1 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000002', 'lab-2', 'Lab Group 2 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000003', 'lab-3', 'Lab Group 3 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000004', 'lab-4', 'Lab Group 4 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000005', 'lab-5', 'Lab Group 5 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000006', 'lab-6', 'Lab Group 6 (Dummy)'),
  ('d0000003-0000-4000-8000-000000000007', 'lab-7', 'Lab Group 7 (Dummy)')
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label;

-- -----------------------------------------------------------------------------
-- COURSES (7)
-- -----------------------------------------------------------------------------

INSERT INTO public.courses (id, school_id, code, name, category, credits)
VALUES
  (
    'd0000004-0000-4000-8000-000000000001',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'CS201',
    'Data Structures',
    'core',
    4
  ),
  (
    'd0000004-0000-4000-8000-000000000002',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'CS202',
    'Database Systems',
    'core',
    4
  ),
  (
    'd0000004-0000-4000-8000-000000000003',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'CS203',
    'Computer Networks',
    'core',
    4
  ),
  (
    'd0000004-0000-4000-8000-000000000004',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'CS204',
    'Data Structures Lab',
    'lab',
    2
  ),
  (
    'd0000004-0000-4000-8000-000000000005',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'ML301',
    'Introduction to Machine Learning',
    'elective',
    3
  ),
  (
    'd0000004-0000-4000-8000-000000000006',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'CY301',
    'Introduction to Cyber Security',
    'elective',
    3
  ),
  (
    'd0000004-0000-4000-8000-000000000007',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'ECO301',
    'Economics for Computing',
    'minor',
    3
  )
ON CONFLICT (school_id, code) DO UPDATE
  SET name = EXCLUDED.name,
      category = EXCLUDED.category,
      credits = EXCLUDED.credits,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- FACULTY MEMBERS (5 dummy)
-- -----------------------------------------------------------------------------

INSERT INTO public.faculty_members (
  id,
  school_id,
  name,
  email,
  initial,
  department
)
VALUES
  (
    'd0000005-0000-4000-8000-000000000001',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'Dr. Dummy Alpha',
    'dummy.alpha@test.saiuconnect.invalid',
    'DA',
    'Dummy Computer Science'
  ),
  (
    'd0000005-0000-4000-8000-000000000002',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'Dr. Dummy Beta',
    'dummy.beta@test.saiuconnect.invalid',
    'DB',
    'Dummy Computer Science'
  ),
  (
    'd0000005-0000-4000-8000-000000000003',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'Dr. Dummy Gamma',
    'dummy.gamma@test.saiuconnect.invalid',
    'DG',
    'Dummy Computer Science'
  ),
  (
    'd0000005-0000-4000-8000-000000000004',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'Dr. Dummy Delta',
    'dummy.delta@test.saiuconnect.invalid',
    'DD',
    'Dummy Computer Science'
  ),
  (
    'd0000005-0000-4000-8000-000000000005',
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    'Dr. Dummy Epsilon',
    'dummy.epsilon@test.saiuconnect.invalid',
    'DE',
    'Dummy Economics'
  )
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      initial = EXCLUDED.initial,
      department = EXCLUDED.department,
      school_id = EXCLUDED.school_id,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- ROOMS (6)
-- -----------------------------------------------------------------------------

INSERT INTO public.rooms (id, code, name, room_type, capacity)
VALUES
  ('d0000006-0000-4000-8000-000000000001', 'A-201', 'Classroom A-201 (Dummy)', 'classroom', 60),
  ('d0000006-0000-4000-8000-000000000002', 'A-202', 'Classroom A-202 (Dummy)', 'classroom', 60),
  ('d0000006-0000-4000-8000-000000000003', 'A-203', 'Classroom A-203 (Dummy)', 'classroom', 60),
  ('d0000006-0000-4000-8000-000000000004', 'A-204', 'Classroom A-204 (Dummy)', 'classroom', 60),
  ('d0000006-0000-4000-8000-000000000005', 'LAB-1', 'Computer Lab 1 (Dummy)', 'lab', 30),
  ('d0000006-0000-4000-8000-000000000006', 'LAB-2', 'Computer Lab 2 (Dummy)', 'lab', 30)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      room_type = EXCLUDED.room_type,
      capacity = EXCLUDED.capacity,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- TIME SLOTS (30): Monday–Friday (day 1–5), 6 periods each
--   P1  09:00–10:00
--   P2  10:00–11:00
--   P3  11:15–12:15
--   P4  12:15–13:15
--   P5  14:00–15:00
--   P6  15:00–16:00
-- -----------------------------------------------------------------------------

INSERT INTO public.time_slots (id, day_of_week, start_time, end_time, period_number, label)
VALUES
  -- Monday (1)
  ('d0000007-0001-4000-8000-000000000001', 1, '09:00', '10:00', 1, 'Mon P1 (Dummy)'),
  ('d0000007-0001-4000-8000-000000000002', 1, '10:00', '11:00', 2, 'Mon P2 (Dummy)'),
  ('d0000007-0001-4000-8000-000000000003', 1, '11:15', '12:15', 3, 'Mon P3 (Dummy)'),
  ('d0000007-0001-4000-8000-000000000004', 1, '12:15', '13:15', 4, 'Mon P4 (Dummy)'),
  ('d0000007-0001-4000-8000-000000000005', 1, '14:00', '15:00', 5, 'Mon P5 (Dummy)'),
  ('d0000007-0001-4000-8000-000000000006', 1, '15:00', '16:00', 6, 'Mon P6 (Dummy)'),
  -- Tuesday (2)
  ('d0000007-0002-4000-8000-000000000001', 2, '09:00', '10:00', 1, 'Tue P1 (Dummy)'),
  ('d0000007-0002-4000-8000-000000000002', 2, '10:00', '11:00', 2, 'Tue P2 (Dummy)'),
  ('d0000007-0002-4000-8000-000000000003', 2, '11:15', '12:15', 3, 'Tue P3 (Dummy)'),
  ('d0000007-0002-4000-8000-000000000004', 2, '12:15', '13:15', 4, 'Tue P4 (Dummy)'),
  ('d0000007-0002-4000-8000-000000000005', 2, '14:00', '15:00', 5, 'Tue P5 (Dummy)'),
  ('d0000007-0002-4000-8000-000000000006', 2, '15:00', '16:00', 6, 'Tue P6 (Dummy)'),
  -- Wednesday (3)
  ('d0000007-0003-4000-8000-000000000001', 3, '09:00', '10:00', 1, 'Wed P1 (Dummy)'),
  ('d0000007-0003-4000-8000-000000000002', 3, '10:00', '11:00', 2, 'Wed P2 (Dummy)'),
  ('d0000007-0003-4000-8000-000000000003', 3, '11:15', '12:15', 3, 'Wed P3 (Dummy)'),
  ('d0000007-0003-4000-8000-000000000004', 3, '12:15', '13:15', 4, 'Wed P4 (Dummy)'),
  ('d0000007-0003-4000-8000-000000000005', 3, '14:00', '15:00', 5, 'Wed P5 (Dummy)'),
  ('d0000007-0003-4000-8000-000000000006', 3, '15:00', '16:00', 6, 'Wed P6 (Dummy)'),
  -- Thursday (4)
  ('d0000007-0004-4000-8000-000000000001', 4, '09:00', '10:00', 1, 'Thu P1 (Dummy)'),
  ('d0000007-0004-4000-8000-000000000002', 4, '10:00', '11:00', 2, 'Thu P2 (Dummy)'),
  ('d0000007-0004-4000-8000-000000000003', 4, '11:15', '12:15', 3, 'Thu P3 (Dummy)'),
  ('d0000007-0004-4000-8000-000000000004', 4, '12:15', '13:15', 4, 'Thu P4 (Dummy)'),
  ('d0000007-0004-4000-8000-000000000005', 4, '14:00', '15:00', 5, 'Thu P5 (Dummy)'),
  ('d0000007-0004-4000-8000-000000000006', 4, '15:00', '16:00', 6, 'Thu P6 (Dummy)'),
  -- Friday (5)
  ('d0000007-0005-4000-8000-000000000001', 5, '09:00', '10:00', 1, 'Fri P1 (Dummy)'),
  ('d0000007-0005-4000-8000-000000000002', 5, '10:00', '11:00', 2, 'Fri P2 (Dummy)'),
  ('d0000007-0005-4000-8000-000000000003', 5, '11:15', '12:15', 3, 'Fri P3 (Dummy)'),
  ('d0000007-0005-4000-8000-000000000004', 5, '12:15', '13:15', 4, 'Fri P4 (Dummy)'),
  ('d0000007-0005-4000-8000-000000000005', 5, '14:00', '15:00', 5, 'Fri P5 (Dummy)'),
  ('d0000007-0005-4000-8000-000000000006', 5, '15:00', '16:00', 6, 'Fri P6 (Dummy)')
ON CONFLICT (day_of_week, start_time, end_time) DO UPDATE
  SET period_number = EXCLUDED.period_number,
      label = EXCLUDED.label;

-- -----------------------------------------------------------------------------
-- TIMETABLE ENTRIES (9)
-- Demonstrates: core, section-only, section+lab, minor, electives, unpublished
-- -----------------------------------------------------------------------------

INSERT INTO public.timetable_entries (
  id,
  academic_term_id,
  school_id,
  course_id,
  faculty_member_id,
  room_id,
  time_slot_id,
  notes,
  is_published
)
VALUES
  -- E1: Core class — no audience rows (published)
  (
    'd0000008-0000-4000-8000-000000000001',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS201' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.alpha@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-201'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 1 AND start_time = '09:00' AND end_time = '10:00'),
    'Dummy core class — all students in school/term (no audience rows)',
    true
  ),
  -- E2: Core class — no audience rows (published)
  (
    'd0000008-0000-4000-8000-000000000002',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS202' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.beta@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-202'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 1 AND start_time = '10:00' AND end_time = '11:00'),
    'Dummy core class — all students in school/term (no audience rows)',
    true
  ),
  -- E3: Core class — no audience rows (published)
  (
    'd0000008-0000-4000-8000-000000000003',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS203' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.gamma@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-203'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 2 AND start_time = '09:00' AND end_time = '10:00'),
    'Dummy core class — all students in school/term (no audience rows)',
    true
  ),
  -- E4: Section-specific class (published)
  (
    'd0000008-0000-4000-8000-000000000004',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS203' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.alpha@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-204'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 3 AND start_time = '09:00' AND end_time = '10:00'),
    'Dummy section-specific tutorial — section-a only',
    true
  ),
  -- E5: Section + lab group lab class (published)
  (
    'd0000008-0000-4000-8000-000000000005',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS204' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.delta@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'LAB-1'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 3 AND start_time = '14:00' AND end_time = '15:00'),
    'Dummy lab — requires section-a AND lab-1',
    true
  ),
  -- E6: Minor class (published)
  (
    'd0000008-0000-4000-8000-000000000006',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'ECO301' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.epsilon@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-201'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 4 AND start_time = '09:00' AND end_time = '10:00'),
    'Dummy minor class — economics minor only',
    true
  ),
  -- E7: ML elective (published)
  (
    'd0000008-0000-4000-8000-000000000007',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'ML301' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.beta@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-202'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 4 AND start_time = '11:15' AND end_time = '12:15'),
    'Dummy elective — audience code ml',
    true
  ),
  -- E8: Cyber Security elective (published)
  (
    'd0000008-0000-4000-8000-000000000008',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CY301' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.gamma@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-203'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 5 AND start_time = '09:00' AND end_time = '10:00'),
    'Dummy elective — audience code cyber-security',
    true
  ),
  -- E9: Unpublished draft entry (no audience rows)
  (
    'd0000008-0000-4000-8000-000000000009',
    (SELECT id FROM public.academic_terms WHERE academic_year_code = 'year-2' AND semester_code = 'spring-2026'),
    (SELECT id FROM public.schools WHERE code = 'test-school'),
    (SELECT id FROM public.courses WHERE code = 'CS202' AND school_id = (SELECT id FROM public.schools WHERE code = 'test-school')),
    (SELECT id FROM public.faculty_members WHERE email = 'dummy.alpha@test.saiuconnect.invalid'),
    (SELECT id FROM public.rooms WHERE code = 'A-204'),
    (SELECT id FROM public.time_slots WHERE day_of_week = 5 AND start_time = '15:00' AND end_time = '16:00'),
    'Dummy unpublished draft — should not appear in student timetable',
    false
  )
ON CONFLICT (id) DO UPDATE
  SET notes = EXCLUDED.notes,
      is_published = EXCLUDED.is_published,
      updated_at = now();

-- -----------------------------------------------------------------------------
-- TIMETABLE ENTRY AUDIENCES (6 rows across 5 entries)
-- E1–E3, E9: no audience rows (core / unrestricted / unpublished)
-- -----------------------------------------------------------------------------

INSERT INTO public.timetable_entry_audiences (
  id,
  timetable_entry_id,
  audience_type,
  audience_code
)
VALUES
  -- E4: section-specific
  (
    'd0000009-0000-4000-8000-000000000001',
    'd0000008-0000-4000-8000-000000000004',
    'section',
    'section-a'
  ),
  -- E5: section + lab group (AND semantics)
  (
    'd0000009-0000-4000-8000-000000000002',
    'd0000008-0000-4000-8000-000000000005',
    'section',
    'section-a'
  ),
  (
    'd0000009-0000-4000-8000-000000000003',
    'd0000008-0000-4000-8000-000000000005',
    'lab_group',
    'lab-1'
  ),
  -- E6: minor
  (
    'd0000009-0000-4000-8000-000000000004',
    'd0000008-0000-4000-8000-000000000006',
    'minor',
    'economics'
  ),
  -- E7: ML elective
  (
    'd0000009-0000-4000-8000-000000000005',
    'd0000008-0000-4000-8000-000000000007',
    'elective',
    'ml'
  ),
  -- E8: Cyber Security elective
  (
    'd0000009-0000-4000-8000-000000000006',
    'd0000008-0000-4000-8000-000000000008',
    'elective',
    'cyber-security'
  )
ON CONFLICT (timetable_entry_id, audience_type, audience_code) DO NOTHING;

COMMIT;
