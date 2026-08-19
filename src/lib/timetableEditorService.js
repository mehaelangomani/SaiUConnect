import { supabase } from './supabase'
import { groupAudiencesByEntry } from './timetableService'
import { formatTimeValue } from './timetableUtils'
import { updateCourseCategory } from './adminCatalogService'
import {
  createTimetableEntry,
  detectTimetableConflicts,
  TimetableConflictError,
  updateTimetableEntry,
} from './adminTimetableService'

export { TimetableConflictError }

const SECTION_OPTIONS = ['1', '2', '3', '4', '5', '6', '7']

export function getSectionOptions() {
  return [
    { value: 'none', label: 'None' },
    ...SECTION_OPTIONS.map((value) => ({
      value,
      label: `Section ${value}`,
    })),
  ]
}

export function getSectionDisplay(audiences = []) {
  const section = audiences.find((item) => item.audience_type === 'section')
  if (!section) {
    return null
  }
  const numeric = section.audience_code.replace(/^section-?/i, '')
  if (/^\d+$/.test(numeric)) {
    return `Section ${numeric}`
  }
  return `Section ${section.audience_code}`
}

export function buildSectionAudience(sectionValue) {
  if (!sectionValue || sectionValue === 'none') {
    return null
  }
  return { audience_type: 'section', audience_code: String(sectionValue) }
}

function padTimePart(value) {
  return String(value).padStart(2, '0')
}

export function formatTime12Hour(time) {
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

function parseTwelveHourClock(hourStr, minuteStr, meridiem) {
  let hours = Number(hourStr)
  const minutes = Number(minuteStr)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null
  }

  const isPm = meridiem.toUpperCase() === 'PM'
  if (hours === 12) {
    hours = isPm ? 12 : 0
  } else if (isPm) {
    hours += 12
  }

  return `${padTimePart(hours)}:${padTimePart(minutes)}:00`
}

export function parseTimeRangeInput(input) {
  const text = String(input).trim()
  const twelveHourMatch = text.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  )
  if (twelveHourMatch) {
    const startTime = parseTwelveHourClock(twelveHourMatch[1], twelveHourMatch[2], twelveHourMatch[3])
    const endTime = parseTwelveHourClock(twelveHourMatch[4], twelveHourMatch[5], twelveHourMatch[6])
    if (!startTime || !endTime) {
      return null
    }
    return {
      startTime,
      endTime,
      label: `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`,
    }
  }

  const match = text.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/)
  if (!match) {
    return null
  }
  const normalize = (time) => {
    const [hours, minutes] = time.split(':')
    return `${hours.padStart(2, '0')}:${minutes}:00`
  }
  return {
    startTime: normalize(match[1]),
    endTime: normalize(match[2]),
    label: `${match[1]}–${match[2]}`,
  }
}

export function formatTimeSlotLabel(slot) {
  return `${formatTime12Hour(slot.start_time)} - ${formatTime12Hour(slot.end_time)}`
}

export async function fetchEntryForCell({ academicTermId, roomId, timeSlotId }) {
  const { data, error } = await supabase
    .from('timetable_entries')
    .select('id, is_published')
    .eq('academic_term_id', academicTermId)
    .eq('room_id', roomId)
    .eq('time_slot_id', timeSlotId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchDayTimetableData(dayOfWeek, academicTermId) {
  const [entriesResult, audiencesResult] = await Promise.all([
    supabase
      .from('v_timetable_entries_enriched')
      .select('*')
      .eq('academic_term_id', academicTermId)
      .eq('day_of_week', dayOfWeek),
    supabase.from('timetable_entry_audiences').select('timetable_entry_id, audience_type, audience_code'),
  ])

  if (entriesResult.error) throw entriesResult.error
  if (audiencesResult.error) throw audiencesResult.error

  const audiencesByEntry = groupAudiencesByEntry(audiencesResult.data ?? [])
  const entries = (entriesResult.data ?? []).map((row) => {
    const audiences = audiencesByEntry.get(row.id) ?? []
    return {
      id: row.id,
      schoolId: row.school_id,
      schoolCode: row.school_code,
      courseId: row.course_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      courseCategory: row.course_category,
      facultyMemberId: row.faculty_member_id,
      facultyName: row.faculty_name ?? 'TBA',
      roomId: row.room_id,
      roomCode: row.room_code,
      roomName: row.room_name,
      timeSlotId: row.time_slot_id,
      dayOfWeek: row.day_of_week,
      startTime: formatTimeValue(row.start_time),
      endTime: formatTimeValue(row.end_time),
      isPublished: row.is_published,
      audiences,
      sectionDisplay: getSectionDisplay(audiences),
      academicTermId: row.academic_term_id,
    }
  })

  const entryMap = new Map()
  for (const entry of entries) {
    if (entry.isPublished) {
      entryMap.set(`${entry.timeSlotId}:${entry.roomId}`, entry)
    }
  }

  return { entries, entryMap, allEntries: entries }
}

export async function saveTimetableCell({
  entry,
  academicTermId,
  schoolId,
  courseId,
  facultyMemberId,
  roomId,
  timeSlotId,
  sectionValue,
  courseCategory,
  isPublished = true,
}) {
  const audiences = {}
  if (sectionValue && sectionValue !== 'none') {
    audiences.section = String(sectionValue)
  }

  if (courseId && courseCategory) {
    await updateCourseCategory(courseId, courseCategory)
  }

  let existingEntry = entry

  if (!existingEntry?.id) {
    const cellEntry = await fetchEntryForCell({ academicTermId, roomId, timeSlotId })
    if (cellEntry?.id) {
      existingEntry = { id: cellEntry.id, isPublished: cellEntry.is_published }
    }
  }

  if (existingEntry?.id) {
    return updateTimetableEntry({
      entryId: existingEntry.id,
      previousEntry: existingEntry,
      academicTermId,
      schoolId,
      courseId,
      facultyMemberId,
      roomId,
      timeSlotId,
      isPublished: isPublished ?? existingEntry.isPublished ?? true,
      audiences,
    })
  }

  const conflicts = await detectTimetableConflicts({
    academicTermId,
    roomId,
    facultyMemberId,
    timeSlotId,
    courseId,
  })

  if (conflicts.length > 0) {
    throw new TimetableConflictError(conflicts[0].message, conflicts)
  }

  return createTimetableEntry({
    academicTermId,
    schoolId,
    courseId,
    facultyMemberId,
    roomId,
    timeSlotId,
    isPublished: isPublished ?? true,
    audiences,
  })
}

export async function unpublishTimetableCell(entry) {
  return updateTimetableEntry({
    entryId: entry.id,
    previousEntry: entry,
    academicTermId: entry.academicTermId,
    schoolId: entry.schoolId,
    courseId: entry.courseId,
    facultyMemberId: entry.facultyMemberId,
    roomId: entry.roomId,
    timeSlotId: entry.timeSlotId,
    isPublished: false,
    audiences: {},
  })
}
