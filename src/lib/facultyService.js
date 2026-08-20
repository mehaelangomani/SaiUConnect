import { supabase } from './supabase'
import { fetchActiveAcademicTerm, resolveSchool } from './academicTermService'
import {
  formatTimeRange,
  getPeriodRowsFromTimeSlots,
  getTimeSlots,
  WEEKDAY_NUMBERS,
} from './classroomService'
import { DAY_NAMES } from './timetableUtils'

const SUGGESTION_LIMIT = 8

const MATCH_RANK = {
  NAME_STARTS: 1,
  NAME_CONTAINS: 2,
  OTHER: 3,
}

function normalizeFacultyMember(row) {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    email: row.email,
    initial: row.initial ?? getInitials(row.name),
    isActive: row.is_active,
  }
}

function getInitials(name) {
  if (!name) {
    return '?'
  }

  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function normalizeCourse(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
  }
}

function buildCoursesByFaculty(entries = []) {
  const coursesByFaculty = new Map()

  for (const entry of entries) {
    if (!entry.faculty_member_id || !entry.courses) {
      continue
    }

    const facultyId = entry.faculty_member_id
    const course = normalizeCourse(entry.courses)

    if (!coursesByFaculty.has(facultyId)) {
      coursesByFaculty.set(facultyId, new Map())
    }

    coursesByFaculty.get(facultyId).set(course.id, course)
  }

  const result = new Map()

  for (const [facultyId, courseMap] of coursesByFaculty.entries()) {
    result.set(
      facultyId,
      [...courseMap.values()].sort((left, right) => left.code.localeCompare(right.code)),
    )
  }

  return result
}

async function fetchFacultyCoursesForProfile(profile) {
  const term = await fetchActiveAcademicTerm()
  const school = await resolveSchool(profile)

  if (!term || !school) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('timetable_entries')
    .select('faculty_member_id, course_id, courses (id, code, name, category)')
    .eq('academic_term_id', term.id)
    .eq('school_id', school.id)
    .eq('is_published', true)
    .not('faculty_member_id', 'is', null)

  if (error) {
    throw error
  }

  return buildCoursesByFaculty(data ?? [])
}

/**
 * Fetch active faculty members and published course context for the student school.
 */
export async function getFacultyDirectory(profile) {
  const { data, error } = await supabase
    .from('faculty_members')
    .select(`
      id,
      profile_id,
      name,
      email,
      initial,
      is_active
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  const faculty = (data ?? []).map(normalizeFacultyMember)

  let coursesByFacultyId = new Map()

  if (profile) {
    try {
      coursesByFacultyId = await fetchFacultyCoursesForProfile(profile)
    } catch {
      coursesByFacultyId = new Map()
    }
  }

  return {
    faculty,
    coursesByFacultyId,
  }
}

function getFacultyMatchRank(member, query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return null
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const name = member.name.toLowerCase()
  const nameWords = name.split(/\s+/).filter(Boolean)
  const searchable = [
    member.name,
    member.email,
    member.initial,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const allTokensMatch = tokens.every((token) => searchable.includes(token))

  if (!allTokensMatch) {
    return null
  }

  if (name.startsWith(normalizedQuery)) {
    return MATCH_RANK.NAME_STARTS
  }

  if (tokens.every((token, index) => {
    const word = nameWords[index]
    return word?.startsWith(token) || nameWords.some((part) => part.startsWith(token))
  })) {
    return MATCH_RANK.NAME_STARTS
  }

  if (name.includes(normalizedQuery) || tokens.every((token) => name.includes(token))) {
    return MATCH_RANK.NAME_CONTAINS
  }

  return MATCH_RANK.OTHER
}

/**
 * Rank and return the best faculty autocomplete suggestions for a query.
 */
export function searchFacultyByKeyword(query, directory) {
  const normalizedQuery = query.trim()

  if (!normalizedQuery || !directory?.faculty?.length) {
    return []
  }

  return directory.faculty
    .map((member) => ({
      member,
      rank: getFacultyMatchRank(member, normalizedQuery),
    }))
    .filter((result) => result.rank !== null)
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank
      }

      return left.member.name.localeCompare(right.member.name)
    })
    .slice(0, SUGGESTION_LIMIT)
    .map((result) => result.member)
}

/**
 * Resolve a single faculty member from a loaded directory list.
 */
export function getFacultyDetails(faculty, facultyId) {
  return faculty.find((member) => member.id === facultyId) ?? null
}

/**
 * Resolve deduplicated courses taught for a faculty member.
 */
export function getFacultyCourses(coursesByFacultyId, facultyId) {
  return coursesByFacultyId.get(facultyId) ?? []
}

function getWeekdaySlots(timeSlots) {
  return timeSlots.filter((slot) => WEEKDAY_NUMBERS.includes(slot.day_of_week))
}

function buildBusyBySlotId(entries = []) {
  const busyBySlotId = new Map()

  for (const entry of entries) {
    const course = entry.courses
    const room = entry.rooms

    busyBySlotId.set(entry.time_slot_id, {
      courseCode: course?.code ?? '',
      courseName: course?.name ?? '',
      roomCode: room?.code ?? '',
      roomName: room?.name ?? '',
      room: room?.name ?? room?.code ?? '',
    })
  }

  return busyBySlotId
}

function buildFacultyAvailabilityGrid(timeSlots, busyBySlotId) {
  const weekdaySlots = getWeekdaySlots(timeSlots)
  const periodRows = getPeriodRowsFromTimeSlots(timeSlots)
  const freeSlots = []
  const busySlots = []

  const grid = periodRows.map((period) => ({
    periodNumber: period.periodNumber,
    timeLabel: period.timeLabel,
    cells: WEEKDAY_NUMBERS.map((day) => {
      const slot = weekdaySlots.find(
        (candidate) =>
          candidate.day_of_week === day
          && candidate.period_number === period.periodNumber,
      )

      if (!slot) {
        return {
          day,
          dayName: DAY_NAMES[day],
          timeSlotId: null,
          timeLabel: period.timeLabel,
          status: 'unavailable',
          busyInfo: null,
        }
      }

      const busyInfo = busyBySlotId.get(slot.id) ?? null
      const cell = {
        day,
        dayName: DAY_NAMES[day],
        timeSlotId: slot.id,
        timeLabel: formatTimeRange(slot.start_time, slot.end_time),
        status: busyInfo ? 'busy' : 'free',
        busyInfo,
      }

      if (cell.status === 'free') {
        freeSlots.push({
          day: cell.day,
          dayName: cell.dayName,
          timeSlotId: cell.timeSlotId,
          timeLabel: cell.timeLabel,
        })
      } else {
        busySlots.push({
          day: cell.day,
          dayName: cell.dayName,
          timeSlotId: cell.timeSlotId,
          timeLabel: cell.timeLabel,
          ...busyInfo,
        })
      }

      return cell
    }),
  }))

  const freeSummary = WEEKDAY_NUMBERS.map((day) => ({
    day,
    dayName: DAY_NAMES[day],
    periods: freeSlots
      .filter((slot) => slot.day === day)
      .map((slot) => slot.timeLabel),
  })).filter((daySummary) => daySummary.periods.length > 0)

  return {
    grid,
    freeSummary,
    freeSlots,
    busySlots,
    hasClasses: busySlots.length > 0,
    dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
  }
}

function createEmptyAvailabilityResult(overrides = {}) {
  return {
    grid: [],
    freeSummary: [],
    freeSlots: [],
    busySlots: [],
    hasClasses: false,
    hasGrid: false,
    dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
    term: null,
    school: null,
    profileIncomplete: false,
    termNotFound: false,
    schoolNotFound: false,
    ...overrides,
  }
}

/**
 * Fetch weekly free/busy availability for a faculty member in the student's term.
 */
export async function getFacultyWeeklyAvailability({ facultyId, profile }) {
  if (!facultyId) {
    return createEmptyAvailabilityResult()
  }

  if (!profile?.school) {
    return createEmptyAvailabilityResult({ profileIncomplete: true })
  }

  const [term, school, timeSlots] = await Promise.all([
    fetchActiveAcademicTerm(),
    resolveSchool(profile),
    getTimeSlots(),
  ])

  if (!term) {
    return createEmptyAvailabilityResult({ school, termNotFound: true })
  }

  if (!school) {
    return createEmptyAvailabilityResult({ term, schoolNotFound: true })
  }

  const weekdaySlots = getWeekdaySlots(timeSlots)
  const timeSlotIds = weekdaySlots.map((slot) => slot.id)
  let entries = []

  if (timeSlotIds.length > 0) {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        id,
        time_slot_id,
        courses (id, code, name),
        rooms (id, code, name)
      `)
      .eq('faculty_member_id', facultyId)
      .eq('academic_term_id', term.id)
      .eq('school_id', school.id)
      .eq('is_published', true)
      .in('time_slot_id', timeSlotIds)

    if (error) {
      throw error
    }

    entries = data ?? []
  }

  const busyBySlotId = buildBusyBySlotId(entries)
  const availability = buildFacultyAvailabilityGrid(timeSlots, busyBySlotId)

  return {
    ...availability,
    hasGrid: availability.grid.length > 0,
    term,
    school,
    profileIncomplete: false,
    termNotFound: false,
    schoolNotFound: false,
  }
}
