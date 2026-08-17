# SaiUConnect Timetable Database — Proposed Schema Design

> **Status: PROPOSED — NOT YET EXECUTED**
>
> This document describes the planned production schema for SaiUConnect timetables.
> Review and approve before running `003_proposed_timetable_schema.sql` in Supabase.

---

## 1. Design goals

- Normalized structure (no repeated faculty/course/room names in schedule rows)
- Supports student timetable generation from saved `profiles` academic configuration
- Supports faculty timetable lookup, free-classroom queries, editor management, admin oversight
- Enables future Row Level Security (RLS) without schema rework
- Avoids duplicating timetable rows for multiple student electives
- Allows the same course to run in different sections/lab groups with different schedule rows

---

## 2. Existing `profiles` integration (unchanged)

The existing `profiles` table remains the source of student academic configuration:

| Column | Type | Timetable matching |
|---|---|---|
| `school` | text | Filter by `schools.code` |
| `academic_year` | text | Filter via `academic_terms.academic_year_code` |
| `semester` | text | Filter via `academic_terms.semester_code` |
| `section` | text | Match `timetable_entry_audiences` where `audience_type = 'section'` |
| `lab_group` | text | Match audiences where `audience_type = 'lab_group'` |
| `minor` | text | Match audiences where `audience_type = 'minor'` (`'none'` = no minor classes) |
| `electives` | text[] | Match audiences where `audience_type = 'elective'` and `audience_code = ANY(electives)` |

**Important:** Profile values are stored as application codes (e.g. `section-a`, `year-2`, `machine-learning`). Reference/catalog tables use the same `code` values so matching does not require a second mapping layer.

---

## 3. Proposed tables

### 3.1 `schools`

**Purpose:** Schools / programs (aligns with `profiles.school`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE NOT NULL | e.g. `cs`, `business` |
| `name` | text NOT NULL | Display name |
| `is_active` | boolean DEFAULT true | |

---

### 3.2 `academic_terms`

**Purpose:** Canonical academic year + semester combinations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academic_year_code` | text NOT NULL | Matches `profiles.academic_year` |
| `semester_code` | text NOT NULL | Matches `profiles.semester` |
| `label` | text NOT NULL | e.g. "Year 2 — Spring 2026" |
| `is_active` | boolean DEFAULT true | |

**Unique:** `(academic_year_code, semester_code)`

---

### 3.3 `sections`

**Purpose:** Section catalog (aligns with `profiles.section`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE NOT NULL | e.g. `section-a` |
| `label` | text NOT NULL | |

---

### 3.4 `lab_groups`

**Purpose:** Lab group catalog (aligns with `profiles.lab_group`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE NOT NULL | e.g. `lab-1` |
| `label` | text NOT NULL | |

---

### 3.5 `courses`

**Purpose:** Master course catalog.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `school_id` | uuid FK → `schools` | |
| `code` | text NOT NULL | e.g. `CS201` |
| `name` | text NOT NULL | |
| `category` | enum | `core`, `minor`, `elective`, `lab`, `tutorial`, `seminar`, `other` |
| `credits` | smallint | Optional |
| `is_active` | boolean DEFAULT true | |

**Unique:** `(school_id, code)`

Minor and elective courses are rows in `courses` with `category = 'minor'` or `'elective'`. The student's chosen minor/elective codes match `courses.code` (or dedicated audience codes — see audiences).

---

### 3.6 `faculty_members`

**Purpose:** Faculty directory for timetable assignment (normalized; names not repeated in schedule rows).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` NULL | Links faculty user account when available |
| `school_id` | uuid FK → `schools` NULL | |
| `name` | text NOT NULL | |
| `email` | text UNIQUE NOT NULL | |
| `initial` | text | |
| `department` | text | Optional |
| `is_active` | boolean DEFAULT true | |

**Future RLS:** Faculty users read entries where `faculty_member_id` matches their linked `profile_id`.

---

### 3.7 `rooms`

**Purpose:** Classroom / lab room catalog.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE NOT NULL | e.g. `block-a-204` |
| `name` | text NOT NULL | |
| `room_type` | enum | `classroom`, `lab`, `seminar`, `auditorium`, `other` |
| `capacity` | smallint | Optional |
| `is_active` | boolean DEFAULT true | |
| `availability_status` | enum | `available`, `maintenance`, `unavailable` — static status; occupancy derived from timetable |

**Free room lookup:** Rooms not appearing in `timetable_entries` for a given `(academic_term_id, time_slot_id)` (and `availability_status = 'available'`).

---

### 3.8 `time_slots`

**Purpose:** Reusable day/time periods.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `day_of_week` | smallint NOT NULL | 0=Sunday … 6=Saturday (or ISO convention — document in migration) |
| `start_time` | time NOT NULL | |
| `end_time` | time NOT NULL | |
| `period_number` | smallint NOT NULL | Ordering within a day |
| `label` | text | Optional, e.g. "Period 3" |

**Unique:** `(day_of_week, start_time, end_time)`

**Check:** `end_time > start_time`

---

### 3.9 `timetable_entries`

**Purpose:** One scheduled class occurrence — the core fact table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academic_term_id` | uuid FK → `academic_terms` NOT NULL | Year + semester scope |
| `school_id` | uuid FK → `schools` NOT NULL | Program/school scope |
| `course_id` | uuid FK → `courses` NOT NULL | |
| `faculty_member_id` | uuid FK → `faculty_members` NULL | TBA allowed |
| `room_id` | uuid FK → `rooms` NOT NULL | |
| `time_slot_id` | uuid FK → `time_slots` NOT NULL | Day + time |
| `notes` | text | Optional editor notes |
| `is_published` | boolean DEFAULT false | Editors publish when ready |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Does NOT store:** faculty name, course name, room name, section, lab group, elective — those come from FKs and `timetable_entry_audiences`.

**Conflict prevention (unique indexes):**
- Same room cannot be double-booked: `(academic_term_id, room_id, time_slot_id)`
- Same faculty cannot teach two classes: `(academic_term_id, faculty_member_id, time_slot_id)` WHERE faculty IS NOT NULL

---

### 3.10 `timetable_entry_audiences`

**Purpose:** Defines *who* a timetable entry applies to — avoids duplicating rows for electives/sections.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `timetable_entry_id` | uuid FK → `timetable_entries` ON DELETE CASCADE | |
| `audience_type` | enum | `all`, `section`, `lab_group`, `minor`, `elective` |
| `audience_code` | text NOT NULL | Matches profile codes or course codes |

**Examples:**

| audience_type | audience_code | Meaning |
|---|---|---|
| `all` | `*` | All students in term/school (rare) |
| `section` | `section-a` | Students with `profiles.section = 'section-a'` |
| `lab_group` | `lab-2` | Students with `profiles.lab_group = 'lab-2'` |
| `minor` | `economics` | Students with `profiles.minor = 'economics'` |
| `elective` | `machine-learning` | Students with code in `profiles.electives` |

**Multiple audience rows:** All rows on the same entry are requirements combined with
**AND**. An entry with `(section, section-a)` and `(lab_group, lab-1)` applies only to
students whose profile matches **both** values. An entry with zero audience rows applies
to all students in the entry's school/term.

**Multiple electives:** One timetable row for "Machine Learning" with audience `(elective, machine-learning)`. A different row for "Cloud Computing" with `(elective, cloud-computing)`. Students see entries where their `electives[]` contains the audience code — **no row duplication per student**.

**Unique:** `(timetable_entry_id, audience_type, audience_code)`

---

## 4. Key relationships (ER summary)

```
schools
  ├── courses
  ├── faculty_members
  └── timetable_entries

academic_terms
  └── timetable_entries

courses ──────────────┐
faculty_members ──────┤
rooms ────────────────┼──► timetable_entries ◄── time_slots
                      │
                      └── timetable_entry_audiences

sections / lab_groups / profile codes ──► matched via audience_code (not FK)
profiles ──► academic config used at query time to filter audiences
```

---

## 5. Query patterns supported

| Question | Approach |
|---|---|
| What classes does this student have? | Join `timetable_entries` → audiences where codes match profile config + term/school |
| Classes at day/time? | Filter `time_slots` by day/time, join entries |
| Who teaches a course? | `timetable_entries` → `faculty_members` |
| Room occupied? | Entries for `(term, room, time_slot)` |
| Rooms free? | `rooms` LEFT JOIN entries WHERE entry IS NULL |
| Section / lab group? | `timetable_entry_audiences` |
| Minor / elective? | Audiences with type `minor` / `elective` |
| School/program/term? | `timetable_entries.school_id`, `academic_term_id` |

---

## 6. Student timetable matching rules

These rules define how a student's saved `profiles` academic configuration maps to
`timetable_entries`. They are enforced at **query time** (not by database constraints).
The schema supports all of them via `timetable_entry_audiences` plus school/term filters
on `timetable_entries`.

### 6.1 Base eligibility (always required)

Before audience matching, every candidate entry must satisfy:

- `timetable_entries.academic_term_id` resolves from `profiles.academic_year` +
  `profiles.semester` via `academic_terms`
- `timetable_entries.school_id` resolves from `profiles.school` via `schools.code`
- `timetable_entries.is_published = true` (for student-facing reads)

### 6.2 Audience semantics: AND across rows, not OR

Each row in `timetable_entry_audiences` is one **requirement** on the student profile.
When an entry has multiple audience rows, **every** row must be satisfied (logical AND).

Examples:

| Audience rows on entry | Student matches when |
|---|---|
| *(none)* | Any student in the school/term (rule 1) |
| `(section, section-a)` | `profiles.section = 'section-a'` (rule 2) |
| `(section, section-a)` + `(lab_group, lab-1)` | section **and** lab group both match (rule 3) |
| `(minor, economics)` | `profiles.minor = 'economics'` and minor ≠ `'none'` (rules 4, 7) |
| `(elective, machine-learning)` | `'machine-learning' = ANY(profiles.electives)` (rules 5, 8) |

An `(all, *)` audience row is always satisfied and is equivalent to placing no
restrictions beyond school/term.

### 6.3 Rule-by-rule verification

| # | Rule | Supported? | How |
|---|---|---|---|
| 1 | No audience restriction → all eligible students in school/term | **Yes** | Zero audience rows on the entry, or an `(all, *)` row. School/term still apply via `timetable_entries`. |
| 2 | Section required → student's section must match | **Yes** | Entry has `(section, <code>)`; student `profiles.section` must equal `<code>`. |
| 3 | Section **and** lab group required → **both** must match | **Yes** | Entry has both `(section, …)` and `(lab_group, …)` rows; AND semantics require both profile values to match. |
| 4 | Minor targeted → student's minor must match | **Yes** | Entry has `(minor, <code>)`; student `profiles.minor` must equal `<code>`. |
| 5 | Elective targeted → code must be in `electives[]` | **Yes** | Entry has `(elective, <code>)`; `<code> = ANY(profiles.electives)`. |
| 6 | Multiple electives → student receives entries for any matched elective | **Yes** | Separate entries (or separate elective audience rows on different entries) per elective course; student matches each independently if the code is in their array. |
| 7 | Minor `'none'` must not match minor classes | **Yes** | Query logic treats `profiles.minor = 'none'` as non-matching for `(minor, …)` audiences. |
| 8 | Empty `electives[]` must not match elective classes | **Yes** | `code = ANY('{}')` is false in PostgreSQL; no elective audience matches. |

**Schema change required:** None. Correct AND-based query logic is sufficient.

### 6.4 Student timetable generation (future app logic)

```text
1. Load student profile (academic_year, semester, school, section, lab_group, minor, electives[])
2. Resolve academic_term_id from year + semester codes
3. Resolve school_id from profiles.school
4. Select timetable_entries WHERE:
     academic_term_id = resolved term
     AND school_id = resolved school
     AND is_published = true
     AND (
       -- Rule 1: no audience rows → unrestricted within school/term
       NOT EXISTS (
         SELECT 1 FROM timetable_entry_audiences tea
         WHERE tea.timetable_entry_id = timetable_entries.id
       )
       OR
       -- Rules 2–8: every audience row must be satisfied (AND)
       NOT EXISTS (
         SELECT 1 FROM timetable_entry_audiences tea
         WHERE tea.timetable_entry_id = timetable_entries.id
           AND NOT student_satisfies_audience(tea, profile)  -- see per-type rules below
       )
     )
5. Join courses, faculty_members, rooms, time_slots for display

student_satisfies_audience(tea, profile):
  - audience_type = 'all'                              → true
  - audience_type = 'section'                        → tea.audience_code = profile.section
  - audience_type = 'lab_group'                        → tea.audience_code = profile.lab_group
  - audience_type = 'minor'                          → profile.minor != 'none'
                                                         AND tea.audience_code = profile.minor
  - audience_type = 'elective'                       → tea.audience_code = ANY(profile.electives)
```

Equivalent SQL (no helper function):

```sql
-- Pseudocode for one entry `te` and student profile `p`
(
  NOT EXISTS (
    SELECT 1 FROM timetable_entry_audiences tea
    WHERE tea.timetable_entry_id = te.id
  )
  OR NOT EXISTS (
    SELECT 1 FROM timetable_entry_audiences tea
    WHERE tea.timetable_entry_id = te.id
      AND NOT (
        tea.audience_type = 'all'
        OR (tea.audience_type = 'section'
            AND tea.audience_code = p.section)
        OR (tea.audience_type = 'lab_group'
            AND tea.audience_code = p.lab_group)
        OR (tea.audience_type = 'minor'
            AND p.minor IS DISTINCT FROM 'none'
            AND tea.audience_code = p.minor)
        OR (tea.audience_type = 'elective'
            AND tea.audience_code = ANY(p.electives))
      )
  )
)
```

---

## 7. Future RLS considerations (not implemented in this migration)

| Role | Planned access |
|---|---|
| `student` | SELECT published entries matching their profile audience |
| `faculty` | SELECT entries where `faculty_members.profile_id = auth.uid()` |
| `editor` | INSERT/UPDATE/DELETE on timetable tables (scoped by school/term) |
| `admin` | Full management |

Schema supports this via:
- `faculty_members.profile_id` → `profiles.id`
- `timetable_entries.is_published` flag
- Audience-based filtering for students

---

## 8. Assumptions

1. Profile text codes (`section-a`, `year-2`, etc.) will align with catalog `code` columns in reference tables.
2. `'none'` for minor means no minor audience entries are matched.
3. Empty `electives[]` means no elective audience entries are matched.
4. One `timetable_entry` = one course occurrence at one time in one room; different sections get separate entries (or separate audience rows on the same entry if they share the slot).
5. Faculty directory is separate from auth `profiles` but can be linked via `profile_id`.
6. No seed/fake timetable data in this phase.
7. Existing `profiles` columns are not renamed or removed.

---

## 9. Proposed migration file

See: [`../migrations/003_proposed_timetable_schema.sql`](../migrations/003_proposed_timetable_schema.sql)

**Do not execute until reviewed and approved.**
