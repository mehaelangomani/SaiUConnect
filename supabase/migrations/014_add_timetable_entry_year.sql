-- SaiUConnect: Add timetable targeting year on timetable_entries.
--
-- Student year lives on profiles.academic_year as text codes:
--   year-1, year-2, year-3, year-4, year-5
-- This column uses the same representation.
--
-- NULL means "all years" for legacy rows (TEST_PACK and earlier data).
-- New Admin editor saves always set a year. The column stays nullable
-- so existing rows remain valid without a backfill.
--
-- This is NOT academic_terms / academic_year_code / semester.

ALTER TABLE public.timetable_entries
  ADD COLUMN IF NOT EXISTS year text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'timetable_entries_year_check'
      AND conrelid = 'public.timetable_entries'::regclass
  ) THEN
    ALTER TABLE public.timetable_entries
      ADD CONSTRAINT timetable_entries_year_check
      CHECK (
        year IS NULL
        OR year IN ('year-1', 'year-2', 'year-3', 'year-4', 'year-5')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.timetable_entries.year IS
  'Target student year (year-1..year-5), matching profiles.academic_year. NULL = all years (legacy).';

CREATE OR REPLACE VIEW public.v_timetable_entries_enriched AS
SELECT
  te.id,
  te.academic_term_id,
  at.academic_year_code,
  at.semester_code,
  te.school_id,
  s.code  AS school_code,
  s.name  AS school_name,
  te.course_id,
  c.code  AS course_code,
  c.name  AS course_name,
  c.category AS course_category,
  te.faculty_member_id,
  fm.name AS faculty_name,
  fm.email AS faculty_email,
  te.room_id,
  r.code  AS room_code,
  r.name  AS room_name,
  te.time_slot_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  ts.period_number,
  te.is_published,
  te.notes,
  te.year
FROM public.timetable_entries te
JOIN public.academic_terms at ON at.id = te.academic_term_id
JOIN public.schools s ON s.id = te.school_id
JOIN public.courses c ON c.id = te.course_id
LEFT JOIN public.faculty_members fm ON fm.id = te.faculty_member_id
JOIN public.rooms r ON r.id = te.room_id
JOIN public.time_slots ts ON ts.id = te.time_slot_id;
