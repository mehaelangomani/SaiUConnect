import { supabase } from './supabase'
import {
  compareTimetableEntries,
  formatCategoryLabel,
  formatTimeValue,
  DAY_NAMES,
} from './timetableUtils'

const NONE_MINOR_VALUE = 'none'

/**
 * Returns true when a single audience row is satisfied by the student profile.
 */
export function studentSatisfiesAudience(audience, profile) {
  switch (audience.audience_type) {
    case 'all':
      return true
    case 'section':
      return audience.audience_code === profile.section
    case 'lab_group':
      return audience.audience_code === profile.lab_group
    case 'minor':
      return (
        profile.minor
        && profile.minor !== NONE_MINOR_VALUE
        && audience.audience_code === profile.minor
      )
    case 'elective':
      return (
        Array.isArray(profile.electives)
        && profile.electives.length > 0
        && profile.electives.includes(audience.audience_code)
      )
    default:
      return false
  }
}

/**
 * Audience rows on the same entry are combined with AND semantics.
 * Zero audience rows means the entry applies to all students in school/term.
 */
export function studentMatchesEntry(audiences, profile) {
  if (!audiences || audiences.length === 0) {
    return true
  }

  return audiences.every((audience) => studentSatisfiesAudience(audience, profile))
}

export function groupAudiencesByEntry(audiences) {
  const grouped = new Map()

  for (const audience of audiences) {
    const existing = grouped.get(audience.timetable_entry_id) ?? []
    existing.push(audience)
    grouped.set(audience.timetable_entry_id, existing)
  }

  return grouped
}

function normalizeTimetableEntry(row) {
  return {
    id: row.id,
    courseCode: row.course_code,
    courseName: row.course_name,
    faculty: row.faculty_name ?? 'TBA',
    room: row.room_name ?? row.room_code ?? '—',
    day: DAY_NAMES[row.day_of_week] ?? 'Unknown',
    dayOfWeek: row.day_of_week,
    startTime: formatTimeValue(row.start_time),
    endTime: formatTimeValue(row.end_time),
    periodNumber: row.period_number,
    category: row.course_category,
    type: formatCategoryLabel(row.course_category),
  }
}

function hasRequiredProfileFields(profile) {
  return Boolean(profile?.school && profile?.academic_year && profile?.semester)
}

/**
 * Fetch published timetable entries and audience rows matched to a student profile.
 */
export async function fetchStudentTimetableData(profile) {
  if (!hasRequiredProfileFields(profile)) {
    return {
      entries: [],
      audiencesByEntry: new Map(),
      profileIncomplete: true,
    }
  }

  const { data: entries, error: entriesError } = await supabase
    .from('v_timetable_entries_enriched')
    .select('*')
    .eq('school_code', profile.school)
    .eq('academic_year_code', profile.academic_year)
    .eq('semester_code', profile.semester)
    .eq('is_published', true)

  if (entriesError) {
    throw entriesError
  }

  if (!entries || entries.length === 0) {
    return {
      entries: [],
      audiencesByEntry: new Map(),
      profileIncomplete: false,
    }
  }

  const entryIds = entries.map((entry) => entry.id)

  const { data: audiences, error: audiencesError } = await supabase
    .from('timetable_entry_audiences')
    .select('timetable_entry_id, audience_type, audience_code')
    .in('timetable_entry_id', entryIds)

  if (audiencesError) {
    throw audiencesError
  }

  const audiencesByEntry = groupAudiencesByEntry(audiences ?? [])

  const matchedEntries = entries.filter((entry) => {
    const entryAudiences = audiencesByEntry.get(entry.id) ?? []
    return studentMatchesEntry(entryAudiences, profile)
  })

  const uniqueEntries = [...new Map(matchedEntries.map((entry) => [entry.id, entry])).values()]

  return {
    entries: uniqueEntries,
    audiencesByEntry,
    profileIncomplete: false,
  }
}

/**
 * Fetch published timetable entries personalized for a student profile.
 */
export async function getStudentTimetable(profile) {
  const { entries } = await fetchStudentTimetableData(profile)

  return entries
    .map(normalizeTimetableEntry)
    .sort(compareTimetableEntries)
}
