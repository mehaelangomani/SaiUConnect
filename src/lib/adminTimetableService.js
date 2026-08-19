import { supabase } from './supabase'
import { groupAudiencesByEntry } from './timetableService'
import { DAY_NAMES, formatTimeValue } from './timetableUtils'

export class TimetableConflictError extends Error {
  constructor(message, conflicts = []) {
    super(message)
    this.name = 'TimetableConflictError'
    this.conflicts = conflicts
  }
}

function formatSlotLabel(dayOfWeek, startTime, endTime) {
  const day = DAY_NAMES[dayOfWeek] ?? 'Unknown'
  return `${day} ${formatTimeValue(startTime)}–${formatTimeValue(endTime)}`
}

function formatAudienceLabel(audiences = []) {
  if (!audiences || audiences.length === 0) {
    return 'All students'
  }

  return audiences
    .map((audience) => `${audience.audience_type}: ${audience.audience_code}`)
    .join(' + ')
}

function buildAudienceRows(audiences = {}) {
  const rows = []

  if (audiences.section) {
    rows.push({ audience_type: 'section', audience_code: audiences.section })
  }

  if (audiences.labGroup) {
    rows.push({ audience_type: 'lab_group', audience_code: audiences.labGroup })
  }

  if (audiences.minor) {
    rows.push({ audience_type: 'minor', audience_code: audiences.minor })
  }

  if (audiences.elective) {
    rows.push({ audience_type: 'elective', audience_code: audiences.elective })
  }

  return rows
}

function normalizeAdminEntry(row, audiences = []) {
  return {
    id: row.id,
    academicTermId: row.academic_term_id,
    schoolId: row.school_id,
    schoolCode: row.school_code,
    schoolName: row.school_name,
    academicYearCode: row.academic_year_code,
    semesterCode: row.semester_code,
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
    day: DAY_NAMES[row.day_of_week] ?? 'Unknown',
    startTime: formatTimeValue(row.start_time),
    endTime: formatTimeValue(row.end_time),
    periodNumber: row.period_number,
    isPublished: row.is_published,
    notes: row.notes,
    audiences,
    audienceLabel: formatAudienceLabel(audiences),
  }
}

/**
 * Fetch reference data needed for timetable forms.
 */
export async function fetchTimetableFormOptions(schoolId) {
  const [
    coursesResult,
    facultyResult,
    roomsResult,
    sectionsResult,
    labGroupsResult,
    timeSlotsResult,
    audiencesResult,
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('id, code, name, category')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('code'),
    supabase
      .from('faculty_members')
      .select('id, name, email')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('rooms')
      .select('id, code, name')
      .eq('is_active', true)
      .order('code'),
    supabase.from('sections').select('id, code, label').order('code'),
    supabase.from('lab_groups').select('id, code, label').order('code'),
    supabase
      .from('time_slots')
      .select('id, day_of_week, start_time, end_time, period_number, label')
      .gte('day_of_week', 1)
      .lte('day_of_week', 5)
      .order('day_of_week')
      .order('period_number'),
    supabase
      .from('timetable_entry_audiences')
      .select('audience_type, audience_code'),
  ])

  const errors = [
    coursesResult.error,
    facultyResult.error,
    roomsResult.error,
    sectionsResult.error,
    labGroupsResult.error,
    timeSlotsResult.error,
    audiencesResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw errors[0]
  }

  const audienceRows = audiencesResult.data ?? []
  const minorCodes = [...new Set(
    audienceRows
      .filter((row) => row.audience_type === 'minor')
      .map((row) => row.audience_code),
  )].sort()
  const electiveCodes = [...new Set(
    audienceRows
      .filter((row) => row.audience_type === 'elective')
      .map((row) => row.audience_code),
  )].sort()

  return {
    courses: coursesResult.data ?? [],
    faculty: facultyResult.data ?? [],
    rooms: roomsResult.data ?? [],
    sections: sectionsResult.data ?? [],
    labGroups: labGroupsResult.data ?? [],
    timeSlots: (timeSlotsResult.data ?? []).map((slot) => ({
      ...slot,
      displayLabel: `${DAY_NAMES[slot.day_of_week]} ${formatTimeValue(slot.start_time)}–${formatTimeValue(slot.end_time)}`,
    })),
    minorAudienceCodes: minorCodes,
    electiveAudienceCodes: electiveCodes,
  }
}

/**
 * Fetch timetable entries for admin management.
 */
export async function fetchAdminTimetableEntries({
  schoolId,
  academicTermId,
  publishedFilter = 'published',
}) {
  let query = supabase
    .from('v_timetable_entries_enriched')
    .select('*')
    .eq('school_id', schoolId)
    .eq('academic_term_id', academicTermId)

  if (publishedFilter === 'published') {
    query = query.eq('is_published', true)
  } else if (publishedFilter === 'draft') {
    query = query.eq('is_published', false)
  }

  const { data: entries, error: entriesError } = await query

  if (entriesError) {
    throw entriesError
  }

  if (!entries || entries.length === 0) {
    return []
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

  return entries
    .map((entry) => normalizeAdminEntry(entry, audiencesByEntry.get(entry.id) ?? []))
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek
      }

      return a.periodNumber - b.periodNumber
    })
}

/**
 * Detect room/faculty/duplicate conflicts before publish or save.
 */
export async function detectTimetableConflicts({
  academicTermId,
  roomId,
  facultyMemberId,
  timeSlotId,
  courseId,
  excludeEntryId = null,
}) {
  const { data: existingEntries, error } = await supabase
    .from('v_timetable_entries_enriched')
    .select('*')
    .eq('academic_term_id', academicTermId)

  if (error) {
    throw error
  }

  const conflicts = []
  const timeSlot = (existingEntries ?? []).find((entry) => entry.time_slot_id === timeSlotId)
    ?? (await supabase
      .from('time_slots')
      .select('day_of_week, start_time, end_time')
      .eq('id', timeSlotId)
      .maybeSingle()).data

  const slotLabel = timeSlot
    ? formatSlotLabel(timeSlot.day_of_week, timeSlot.start_time, timeSlot.end_time)
    : 'the selected time'

  for (const entry of existingEntries ?? []) {
    if (excludeEntryId && entry.id === excludeEntryId) {
      continue
    }

    if (entry.time_slot_id !== timeSlotId) {
      continue
    }

    if (entry.room_id === roomId) {
      conflicts.push({
        type: 'room',
        message: `${entry.room_code} is already occupied during ${slotLabel}.`,
        entryId: entry.id,
      })
    }

    if (facultyMemberId && entry.faculty_member_id === facultyMemberId) {
      conflicts.push({
        type: 'faculty',
        message: `${entry.faculty_name} already has a class during ${slotLabel}.`,
        entryId: entry.id,
      })
    }

    if (entry.course_id === courseId) {
      conflicts.push({
        type: 'duplicate',
        message: `${entry.course_code} is already scheduled during ${slotLabel}.`,
        entryId: entry.id,
      })
    }
  }

  return conflicts
}

function buildClassroomChangePayload({
  previousEntry,
  updatedEntry,
  audiences,
  academicTerm,
  school,
  timeSlot,
}) {
  if (!previousEntry?.isPublished) {
    return null
  }

  if (previousEntry.roomId === updatedEntry.room_id) {
    return null
  }

  return {
    timetableEntryId: previousEntry.id,
    course: {
      id: updatedEntry.course_id,
      code: previousEntry.courseCode,
      name: previousEntry.courseName,
    },
    oldRoom: {
      id: previousEntry.roomId,
      code: previousEntry.roomCode,
      name: previousEntry.roomName,
    },
    newRoom: {
      id: updatedEntry.room_id,
      code: updatedEntry.roomCode ?? previousEntry.roomCode,
      name: updatedEntry.roomName ?? previousEntry.roomName,
    },
    affectedAudience: audiences,
    timeSlot: {
      id: updatedEntry.time_slot_id,
      dayOfWeek: timeSlot?.day_of_week ?? previousEntry.dayOfWeek,
      startTime: formatTimeValue(timeSlot?.start_time ?? previousEntry.startTime),
      endTime: formatTimeValue(timeSlot?.end_time ?? previousEntry.endTime),
      label: timeSlot
        ? formatSlotLabel(timeSlot.day_of_week, timeSlot.start_time, timeSlot.end_time)
        : `${previousEntry.day} ${previousEntry.startTime}–${previousEntry.endTime}`,
    },
    academicTerm: {
      id: academicTerm?.id ?? previousEntry.academicTermId,
      academicYearCode: academicTerm?.academic_year_code ?? previousEntry.academicYearCode,
      semesterCode: academicTerm?.semester_code ?? previousEntry.semesterCode,
    },
    school: {
      id: school?.id ?? previousEntry.schoolId,
      code: school?.code ?? previousEntry.schoolCode,
      name: school?.name ?? previousEntry.schoolName,
    },
    wasPublished: true,
    changedAt: new Date().toISOString(),
  }
}

async function replaceEntryAudiences(entryId, audiences = {}) {
  const { error: deleteError } = await supabase
    .from('timetable_entry_audiences')
    .delete()
    .eq('timetable_entry_id', entryId)

  if (deleteError) {
    throw deleteError
  }

  const audienceRows = buildAudienceRows(audiences).map((row) => ({
    timetable_entry_id: entryId,
    ...row,
  }))

  if (audienceRows.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('timetable_entry_audiences')
    .insert(audienceRows)

  if (insertError) {
    throw insertError
  }
}

/**
 * Create a new timetable entry with audiences.
 */
export async function createTimetableEntry({
  academicTermId,
  schoolId,
  courseId,
  facultyMemberId,
  roomId,
  timeSlotId,
  isPublished = false,
  notes = null,
  audiences = {},
}) {
  if (isPublished) {
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
  }

  const { data, error } = await supabase
    .from('timetable_entries')
    .insert({
      academic_term_id: academicTermId,
      school_id: schoolId,
      course_id: courseId,
      faculty_member_id: facultyMemberId || null,
      room_id: roomId,
      time_slot_id: timeSlotId,
      is_published: isPublished,
      notes,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  await replaceEntryAudiences(data.id, audiences)

  return { entryId: data.id, classroomChange: null }
}

/**
 * Update a timetable entry. Returns audit-friendly change metadata.
 */
export async function updateTimetableEntry({
  entryId,
  previousEntry,
  academicTermId,
  schoolId,
  courseId,
  facultyMemberId,
  roomId,
  timeSlotId,
  isPublished,
  notes = null,
  audiences = {},
  academicTerm = null,
  school = null,
}) {
  const willBePublished = isPublished ?? previousEntry?.isPublished ?? false

  if (willBePublished) {
    const conflicts = await detectTimetableConflicts({
      academicTermId,
      roomId,
      facultyMemberId,
      timeSlotId,
      courseId,
      excludeEntryId: entryId,
    })

    if (conflicts.length > 0) {
      throw new TimetableConflictError(conflicts[0].message, conflicts)
    }
  }

  const { data: timeSlot, error: timeSlotError } = await supabase
    .from('time_slots')
    .select('day_of_week, start_time, end_time, period_number')
    .eq('id', timeSlotId)
    .maybeSingle()

  if (timeSlotError) {
    throw timeSlotError
  }

  const { data: newRoom, error: roomError } = await supabase
    .from('rooms')
    .select('id, code, name')
    .eq('id', roomId)
    .maybeSingle()

  if (roomError) {
    throw roomError
  }

  const updatePayload = {
    academic_term_id: academicTermId,
    school_id: schoolId,
    course_id: courseId,
    faculty_member_id: facultyMemberId || null,
    room_id: roomId,
    time_slot_id: timeSlotId,
    is_published: willBePublished,
    notes,
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('timetable_entries')
    .update(updatePayload)
    .eq('id', entryId)

  if (updateError) {
    throw updateError
  }

  await replaceEntryAudiences(entryId, audiences)

  const audienceRows = buildAudienceRows(audiences)
  const classroomChange = buildClassroomChangePayload({
    previousEntry,
    updatedEntry: {
      ...updatePayload,
      roomCode: newRoom?.code,
      roomName: newRoom?.name,
    },
    audiences: audienceRows,
    academicTerm,
    school,
    timeSlot,
  })

  return {
    entryId,
    classroomChange,
    audit: {
      entryId,
      changedAt: new Date().toISOString(),
      changes: {
        courseId: { old: previousEntry?.courseId, new: courseId },
        facultyMemberId: { old: previousEntry?.facultyMemberId, new: facultyMemberId || null },
        roomId: { old: previousEntry?.roomId, new: roomId },
        timeSlotId: { old: previousEntry?.timeSlotId, new: timeSlotId },
        isPublished: { old: previousEntry?.isPublished, new: willBePublished },
      },
      classroomChange,
    },
  }
}

/**
 * Publish an existing draft entry after conflict checks.
 */
export async function publishTimetableEntry(entry) {
  return updateTimetableEntry({
    entryId: entry.id,
    previousEntry: entry,
    academicTermId: entry.academicTermId,
    schoolId: entry.schoolId,
    courseId: entry.courseId,
    facultyMemberId: entry.facultyMemberId,
    roomId: entry.roomId,
    timeSlotId: entry.timeSlotId,
    isPublished: true,
    notes: entry.notes,
    audiences: {
      section: entry.audiences.find((item) => item.audience_type === 'section')?.audience_code ?? '',
      labGroup: entry.audiences.find((item) => item.audience_type === 'lab_group')?.audience_code ?? '',
      minor: entry.audiences.find((item) => item.audience_type === 'minor')?.audience_code ?? '',
      elective: entry.audiences.find((item) => item.audience_type === 'elective')?.audience_code ?? '',
    },
  })
}

/**
 * Unpublish a published entry (students will no longer see it).
 */
export async function unpublishTimetableEntry(entry) {
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
    notes: entry.notes,
    audiences: {
      section: entry.audiences.find((item) => item.audience_type === 'section')?.audience_code ?? '',
      labGroup: entry.audiences.find((item) => item.audience_type === 'lab_group')?.audience_code ?? '',
      minor: entry.audiences.find((item) => item.audience_type === 'minor')?.audience_code ?? '',
      elective: entry.audiences.find((item) => item.audience_type === 'elective')?.audience_code ?? '',
    },
  })
}

/**
 * Build a period-row grid structure for the admin timetable view.
 */
export function buildAdminTimetableGrid(entries = [], timeSlots = []) {
  const weekdaySlots = timeSlots.filter((slot) => slot.day_of_week >= 1 && slot.day_of_week <= 5)
  const periodNumbers = [...new Set(weekdaySlots.map((slot) => slot.period_number))].sort(
    (a, b) => a - b,
  )

  const slotByDayPeriod = new Map()
  for (const slot of weekdaySlots) {
    slotByDayPeriod.set(`${slot.day_of_week}-${slot.period_number}`, slot)
  }

  const entriesBySlotId = new Map()
  for (const entry of entries) {
    const existing = entriesBySlotId.get(entry.timeSlotId) ?? []
    existing.push(entry)
    entriesBySlotId.set(entry.timeSlotId, existing)
  }

  const rows = periodNumbers.map((periodNumber) => {
    const mondaySlot = slotByDayPeriod.get(`1-${periodNumber}`)
    const cells = [1, 2, 3, 4, 5].map((dayOfWeek) => {
      const slot = slotByDayPeriod.get(`${dayOfWeek}-${periodNumber}`)
      return {
        dayOfWeek,
        day: DAY_NAMES[dayOfWeek],
        timeSlotId: slot?.id ?? null,
        startTime: slot ? formatTimeValue(slot.start_time) : '',
        endTime: slot ? formatTimeValue(slot.end_time) : '',
        entries: slot ? (entriesBySlotId.get(slot.id) ?? []) : [],
      }
    })

    return {
      periodNumber,
      label: mondaySlot
        ? `${formatTimeValue(mondaySlot.start_time)}–${formatTimeValue(mondaySlot.end_time)}`
        : `Period ${periodNumber}`,
      cells,
    }
  })

  return rows
}
