import { supabase } from './supabase'
import { DAY_NAMES } from './timetableUtils'
import { groupAudiencesByEntry } from './timetableService'
import { getSectionDisplay } from './timetableEditorService'

function padTimePart(value) {
  return String(value).padStart(2, '0')
}

export function formatFacultyTime12Hour(time) {
  if (!time) {
    return ''
  }

  const [hourPart, minutePart] = String(time).split(':')
  const hours24 = Number(hourPart)
  const minutes = Number(minutePart)
  if (!Number.isFinite(hours24) || !Number.isFinite(minutes)) {
    return ''
  }

  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${padTimePart(minutes)} ${period}`
}

export function formatFacultyTimeRange(startTime, endTime) {
  const start = formatFacultyTime12Hour(startTime)
  const end = formatFacultyTime12Hour(endTime)
  if (!start || !end) {
    return '—'
  }
  return `${start} - ${end}`
}

function formatSectionLabel(audienceCode) {
  const numeric = String(audienceCode ?? '').replace(/^section-?/i, '')
  if (!numeric || numeric.toLowerCase() === 'none') {
    return null
  }
  if (/^\d+$/.test(numeric)) {
    return numeric
  }
  return numeric
}

export function formatFacultySections(audiences = []) {
  const labels = audiences
    .filter((item) => item.audience_type === 'section')
    .map((item) => formatSectionLabel(item.audience_code))
    .filter(Boolean)

  if (labels.length === 0) {
    return '—'
  }

  return [...new Set(labels)].join(', ')
}

export function findFacultyByProfileId(facultyList, profileId) {
  if (!profileId || !Array.isArray(facultyList)) {
    return null
  }
  return facultyList.find((member) => member.profileId === profileId) ?? null
}

async function fetchActiveTerm() {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('id, academic_year_code, semester_code, label')
    .eq('is_active', true)
    .order('academic_year_code', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

function toFriendlyError(error) {
  const message = String(error?.message ?? '')
  if (message.toLowerCase().includes('row-level security') || error?.code === '42501') {
    return 'You do not have permission to view this timetable.'
  }
  return 'Could not load the timetable. Please try again.'
}

export async function fetchFacultyTimetable(facultyMemberId) {
  if (!facultyMemberId) {
    return { term: null, entries: [] }
  }

  const term = await fetchActiveTerm()
  if (!term?.id) {
    return { term: null, entries: [], message: 'No active academic term found.' }
  }

  const { data, error } = await supabase
    .from('timetable_entries')
    .select(`
      id,
      faculty_member_id,
      is_published,
      year,
      time_slots (
        day_of_week,
        start_time,
        end_time,
        period_number
      ),
      courses (
        code,
        name
      ),
      rooms (
        code,
        name
      ),
      faculty_members (
        name
      )
    `)
    .eq('faculty_member_id', facultyMemberId)
    .eq('academic_term_id', term.id)
    .eq('is_published', true)

  if (error) {
    throw new Error(toFriendlyError(error))
  }

  const rows = data ?? []
  const entryIds = rows.map((row) => row.id)
  let audiencesByEntry = new Map()

  if (entryIds.length > 0) {
    const audiencesResult = await supabase
      .from('timetable_entry_audiences')
      .select('timetable_entry_id, audience_type, audience_code')
      .in('timetable_entry_id', entryIds)

    if (!audiencesResult.error) {
      audiencesByEntry = groupAudiencesByEntry(audiencesResult.data ?? [])
    }
  }

  const entries = rows
    .map((row) => {
      const slot = row.time_slots ?? {}
      const course = row.courses ?? {}
      const room = row.rooms ?? {}
      const faculty = row.faculty_members ?? {}
      const audiences = audiencesByEntry.get(row.id) ?? []

      return {
        id: row.id,
        dayOfWeek: slot.day_of_week ?? 0,
        dayName: DAY_NAMES[slot.day_of_week] ?? '—',
        startTime: slot.start_time ?? '',
        endTime: slot.end_time ?? '',
        periodNumber: slot.period_number ?? null,
        timeLabel: formatFacultyTimeRange(slot.start_time, slot.end_time),
        sortMinutes:
          Number(String(slot.start_time ?? '00:00').slice(0, 2)) * 60 +
          Number(String(slot.start_time ?? '00:00').slice(3, 5)),
        courseName: course.name || course.code || '—',
        course: course.name || course.code || '—',
        year: row.year ?? null,
        room: room.code || room.name || '—',
        faculty: faculty.name || '—',
        section: formatFacultySections(audiences),
        sectionLabel: getSectionDisplay(audiences),
      }
    })
    .sort((left, right) => {
      const dayDifference = left.dayOfWeek - right.dayOfWeek
      if (dayDifference !== 0) {
        return dayDifference
      }
      return left.sortMinutes - right.sortMinutes
    })

  return { term, entries }
}
