-- =============================================================================
-- SaiUConnect — Admin catalog bootstrap seed (schools + rooms)
-- =============================================================================
--
-- STATUS: NOT YET EXECUTED — FOR MANUAL RUN ONLY
--
-- Depends on: 003_create_timetable_schema.sql
-- Optional companion to src/lib/catalogBootstrapService.js (runtime bootstrap).
--
-- Inserts the 8 standard school codes and AB1/AB2 room columns if missing.
-- Does NOT duplicate rows (ON CONFLICT on code).
-- Faculty/courses remain seeded by migration 004 or runtime bootstrap when empty.
-- =============================================================================

BEGIN;

INSERT INTO public.schools (code, name)
VALUES
  ('SCDS', 'SCDS'),
  ('SOL', 'SOL'),
  ('SAS', 'SAS'),
  ('SOAI', 'SOAI'),
  ('SOB', 'SOB'),
  ('SOT', 'SOT'),
  ('SOM', 'SOM'),
  ('SAHS', 'SAHS')
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      is_active = true,
      updated_at = now();

INSERT INTO public.rooms (code, name)
VALUES
  ('AB1 Ai Lab', 'AB1 Ai Lab'),
  ('AB1 Mootcourt', 'AB1 Mootcourt'),
  ('AB1 Computer Lab', 'AB1 Computer Lab'),
  ('AB1 101', 'AB1 101'),
  ('AB1 102', 'AB1 102'),
  ('AB1 103', 'AB1 103'),
  ('AB1 104', 'AB1 104'),
  ('AB1 201', 'AB1 201'),
  ('AB2 101', 'AB2 101'),
  ('AB2 202', 'AB2 202'),
  ('AB2 203', 'AB2 203'),
  ('AB2 204', 'AB2 204'),
  ('AB2 205', 'AB2 205'),
  ('AB2 206', 'AB2 206'),
  ('AB2 207', 'AB2 207'),
  ('AB2 208', 'AB2 208'),
  ('AB2 209', 'AB2 209'),
  ('AB2 210', 'AB2 210'),
  ('AB2 211', 'AB2 211'),
  ('AB2 212', 'AB2 212')
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      is_active = true,
      updated_at = now();

COMMIT;
