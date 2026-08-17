-- =============================================================================
-- SaiUConnect Timetable Schema — EXECUTABLE MIGRATION
-- =============================================================================
--
-- Creates the approved timetable schema. Does NOT modify the existing
-- `profiles` table. Does NOT add seed data or RLS policies.
--
-- Depends on (already executed):
--   001_add_academic_setup_to_profiles.sql
--   002_convert_elective_to_electives_array.sql
--
-- Reviewed design (commented reference):
--   003_proposed_timetable_schema.sql
--
-- Design documentation:
--   supabase/docs/timetable-schema-design.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE public.course_category AS ENUM (
  'core',
  'minor',
  'elective',
  'lab',
  'tutorial',
  'seminar',
  'other'
);

CREATE TYPE public.room_type AS ENUM (
  'classroom',
  'lab',
  'seminar',
  'auditorium',
  'other'
);

CREATE TYPE public.room_availability_status AS ENUM (
  'available',
  'maintenance',
  'unavailable'
);

CREATE TYPE public.audience_type AS ENUM (
  'all',
  'section',
  'lab_group',
  'minor',
  'elective'
);

-- -----------------------------------------------------------------------------
-- REFERENCE / CATALOG TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE public.schools (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_terms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_code  text NOT NULL,
  semester_code       text NOT NULL,
  label               text NOT NULL,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_terms_year_semester_unique
    UNIQUE (academic_year_code, semester_code)
);

CREATE TABLE public.sections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  label      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  label      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid NOT NULL REFERENCES public.schools (id) ON DELETE RESTRICT,
  code       text NOT NULL,
  name       text NOT NULL,
  category   public.course_category NOT NULL DEFAULT 'core',
  credits    smallint,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_school_code_unique UNIQUE (school_id, code)
);

CREATE INDEX IF NOT EXISTS courses_school_id_idx ON public.courses (school_id);
CREATE INDEX IF NOT EXISTS courses_category_idx ON public.courses (category);

CREATE TABLE public.faculty_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  school_id   uuid REFERENCES public.schools (id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  initial     text,
  department  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faculty_members_profile_id_idx ON public.faculty_members (profile_id);
CREATE INDEX IF NOT EXISTS faculty_members_school_id_idx ON public.faculty_members (school_id);

CREATE TABLE public.rooms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text NOT NULL UNIQUE,
  name                text NOT NULL,
  room_type           public.room_type NOT NULL DEFAULT 'classroom',
  capacity            smallint,
  availability_status public.room_availability_status NOT NULL DEFAULT 'available',
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rooms_room_type_idx ON public.rooms (room_type);
CREATE INDEX IF NOT EXISTS rooms_availability_status_idx ON public.rooms (availability_status);

CREATE TABLE public.time_slots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week    smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time     time NOT NULL,
  end_time       time NOT NULL,
  period_number  smallint NOT NULL,
  label          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT time_slots_day_time_unique
    UNIQUE (day_of_week, start_time, end_time),
  CONSTRAINT time_slots_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS time_slots_day_period_idx ON public.time_slots (day_of_week, period_number);

-- -----------------------------------------------------------------------------
-- TIMETABLE CORE TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE public.timetable_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_term_id  uuid NOT NULL REFERENCES public.academic_terms (id) ON DELETE RESTRICT,
  school_id         uuid NOT NULL REFERENCES public.schools (id) ON DELETE RESTRICT,
  course_id         uuid NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  faculty_member_id uuid REFERENCES public.faculty_members (id) ON DELETE SET NULL,
  room_id           uuid NOT NULL REFERENCES public.rooms (id) ON DELETE RESTRICT,
  time_slot_id      uuid NOT NULL REFERENCES public.time_slots (id) ON DELETE RESTRICT,
  notes             text,
  is_published      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Prevent double-booking a room in the same term and time slot
CREATE UNIQUE INDEX IF NOT EXISTS timetable_entries_room_slot_unique
  ON public.timetable_entries (academic_term_id, room_id, time_slot_id);

-- Prevent a faculty member teaching two classes at the same time
CREATE UNIQUE INDEX IF NOT EXISTS timetable_entries_faculty_slot_unique
  ON public.timetable_entries (academic_term_id, faculty_member_id, time_slot_id)
  WHERE faculty_member_id IS NOT NULL;

-- Common query indexes
CREATE INDEX IF NOT EXISTS timetable_entries_term_school_idx
  ON public.timetable_entries (academic_term_id, school_id);
CREATE INDEX IF NOT EXISTS timetable_entries_course_idx
  ON public.timetable_entries (course_id);
CREATE INDEX IF NOT EXISTS timetable_entries_faculty_idx
  ON public.timetable_entries (faculty_member_id);
CREATE INDEX IF NOT EXISTS timetable_entries_time_slot_idx
  ON public.timetable_entries (time_slot_id);
CREATE INDEX IF NOT EXISTS timetable_entries_published_idx
  ON public.timetable_entries (is_published)
  WHERE is_published = true;

-- -----------------------------------------------------------------------------
-- AUDIENCE TARGETING (section, lab group, minor, elective)
-- Avoids duplicating timetable rows per student elective selection.
--
-- STUDENT MATCHING SEMANTICS (query-time, not enforced by constraints):
--
--   Base filter: entry school_id + academic_term_id must match the student profile.
--
--   Rule 1 — No audience rows (or a single `all` row) → entry applies to every
--            student in that school/term.
--
--   Rules 2–5 — Each audience row is one requirement. Multiple rows on the same
--               entry are combined with AND (all must match), not OR.
--               Examples:
--                 (section, section-a)           → section must match
--                 (section, …) + (lab_group, …)  → BOTH must match
--                 (minor, economics)             → minor must match
--                 (elective, ml)                 → code must be in electives[]
--
--   Rule 6 — Multiple electives: student matches separate elective entries
--            independently when each code is in electives[].
--
--   Rule 7 — profiles.minor = 'none' never satisfies (minor, …) audiences.
--
--   Rule 8 — empty electives[] never satisfies (elective, …) audiences.
--
--   Full documentation: supabase/docs/timetable-schema-design.md §6
-- -----------------------------------------------------------------------------

CREATE TABLE public.timetable_entry_audiences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id  uuid NOT NULL REFERENCES public.timetable_entries (id) ON DELETE CASCADE,
  audience_type       public.audience_type NOT NULL,
  audience_code       text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timetable_entry_audiences_unique
    UNIQUE (timetable_entry_id, audience_type, audience_code)
);

CREATE INDEX IF NOT EXISTS timetable_entry_audiences_entry_idx
  ON public.timetable_entry_audiences (timetable_entry_id);
CREATE INDEX IF NOT EXISTS timetable_entry_audiences_lookup_idx
  ON public.timetable_entry_audiences (audience_type, audience_code);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (deferred — enable in a future migration)
-- -----------------------------------------------------------------------------
--
-- ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.timetable_entry_audiences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
--
-- Example future student read policy (pseudocode):
--   Students can SELECT published timetable_entries where school/term match AND
--   (no audience rows OR every audience row is satisfied — AND semantics).
--   See timetable-schema-design.md §6 for per-type rules including minor='none'
--   and empty electives[] handling.

-- -----------------------------------------------------------------------------
-- HELPER VIEW (for student timetable queries)
-- -----------------------------------------------------------------------------

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
  te.notes
FROM public.timetable_entries te
JOIN public.academic_terms at ON at.id = te.academic_term_id
JOIN public.schools s ON s.id = te.school_id
JOIN public.courses c ON c.id = te.course_id
LEFT JOIN public.faculty_members fm ON fm.id = te.faculty_member_id
JOIN public.rooms r ON r.id = te.room_id
JOIN public.time_slots ts ON ts.id = te.time_slot_id;
