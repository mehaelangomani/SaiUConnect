import { supabase } from './supabase'
import { fetchStudentTimetableData } from './timetableService'
import {
  DAY_NAMES,
  formatCategoryLabel,
  formatTimeValue,
} from './timetableUtils'

const CATEGORY_ORDER = ['core', 'minor', 'elective', 'lab', 'tutorial', 'seminar', 'other']

const LAB_FILTER_CATEGORIES = new Set(['lab', 'tutorial', 'seminar', 'other'])

function compareSchedules(left, right) {
  if (left.dayOfWeek !== right.dayOfWeek) {
    return left.dayOfWeek - right.dayOfWeek
  }

  return left.startTime.localeCompare(right.startTime)
}

function compareCourses(left, right) {
  const categoryDifference =
    CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category)

  if (categoryDifference !== 0) {
    return categoryDifference
  }

  return left.code.localeCompare(right.code)
}

function formatScheduleLabel(entry) {
  const day = DAY_NAMES[entry.day_of_week] ?? 'Unknown'
  const start = formatTimeValue(entry.start_time)
  const end = formatTimeValue(entry.end_time)

  return `${day} ${start}–${end}`
}

function formatAudienceContext(audiences = []) {
  const section = audiences.find((audience) => audience.audience_type === 'section')?.audience_code
  const labGroup = audiences.find((audience) => audience.audience_type === 'lab_group')?.audience_code
  const parts = []

  if (section) {
    parts.push(`Section ${section}`)
  }

  if (labGroup) {
    parts.push(`Lab ${labGroup}`)
  }

  return parts.join(' · ')
}

function buildScheduleOccurrence(entry, audiences) {
  return {
    id: entry.id,
    day: DAY_NAMES[entry.day_of_week] ?? 'Unknown',
    dayOfWeek: entry.day_of_week,
    startTime: formatTimeValue(entry.start_time),
    endTime: formatTimeValue(entry.end_time),
    label: formatScheduleLabel(entry),
    room: entry.room_name ?? entry.room_code ?? '—',
    facultyId: entry.faculty_member_id ?? null,
    facultyName: entry.faculty_name ?? null,
    audienceContext: formatAudienceContext(audiences),
  }
}

function dedupeSchedules(schedules) {
  const seen = new Set()

  return schedules.filter((schedule) => {
    const key = [
      schedule.dayOfWeek,
      schedule.startTime,
      schedule.endTime,
      schedule.room,
      schedule.facultyId ?? '',
    ].join('|')

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function groupEntriesByCourse(entries) {
  const grouped = new Map()

  for (const entry of entries) {
    const existing = grouped.get(entry.course_id) ?? []
    existing.push(entry)
    grouped.set(entry.course_id, existing)
  }

  return grouped
}

function buildEnrolledCourse(courseId, entries, audiencesByEntry, courseMeta) {
  const facultyById = new Map()
  const rooms = new Set()
  const audienceContexts = new Set()
  const schedules = []

  for (const entry of entries) {
    const entryAudiences = audiencesByEntry.get(entry.id) ?? []
    schedules.push(buildScheduleOccurrence(entry, entryAudiences))

    if (entry.faculty_member_id && entry.faculty_name) {
      facultyById.set(entry.faculty_member_id, entry.faculty_name)
    }

    const roomLabel = entry.room_name ?? entry.room_code
    if (roomLabel) {
      rooms.add(roomLabel)
    }

    const audienceContext = formatAudienceContext(entryAudiences)
    if (audienceContext) {
      audienceContexts.add(audienceContext)
    }
  }

  const facultyNames = [...facultyById.values()].sort((left, right) => left.localeCompare(right))
  const dedupedSchedules = dedupeSchedules(schedules).sort(compareSchedules)
  const category = courseMeta?.category ?? entries[0].course_category

  return {
    id: courseId,
    code: courseMeta?.code ?? entries[0].course_code,
    name: courseMeta?.name ?? entries[0].course_name,
    category,
    categoryLabel: formatCategoryLabel(category),
    credits: courseMeta?.credits ?? null,
    facultyNames,
    primaryFaculty: facultyNames[0] ?? null,
    rooms: [...rooms].sort((left, right) => left.localeCompare(right)),
    primaryRoom: [...rooms][0] ?? null,
    audienceContext: [...audienceContexts].join(' · '),
    schedules: dedupedSchedules,
    scheduleCount: dedupedSchedules.length,
  }
}

async function fetchCourseMetadata(courseIds) {
  if (courseIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('courses')
    .select('id, code, name, category, credits')
    .in('id', courseIds)

  if (error) {
    throw error
  }

  return new Map((data ?? []).map((course) => [course.id, course]))
}

async function buildEnrolledCoursesFromTimetableData({ entries, audiencesByEntry }) {
  if (entries.length === 0) {
    return []
  }

  const entriesByCourse = groupEntriesByCourse(entries)
  const courseIds = [...entriesByCourse.keys()]
  const courseMetadata = await fetchCourseMetadata(courseIds)

  return [...entriesByCourse.entries()]
    .map(([courseId, courseEntries]) =>
      buildEnrolledCourse(
        courseId,
        courseEntries,
        audiencesByEntry,
        courseMetadata.get(courseId),
      ),
    )
    .sort(compareCourses)
}

/**
 * Fetch enrolled courses derived from matching published timetable entries.
 */
export async function getStudentEnrolledCourses(profile) {
  const timetableData = await fetchStudentTimetableData(profile)

  if (timetableData.profileIncomplete) {
    return {
      courses: [],
      profileIncomplete: true,
    }
  }

  const courses = await buildEnrolledCoursesFromTimetableData(timetableData)

  return {
    courses,
    profileIncomplete: false,
  }
}

/**
 * Fetch detailed information for a single enrolled course.
 */
export async function getStudentCourseDetails(courseId, profile) {
  const timetableData = await fetchStudentTimetableData(profile)

  if (timetableData.profileIncomplete) {
    return {
      course: null,
      profileIncomplete: true,
    }
  }

  const courseEntries = timetableData.entries.filter((entry) => entry.course_id === courseId)

  if (courseEntries.length === 0) {
    return {
      course: null,
      profileIncomplete: false,
    }
  }

  const courseMetadata = await fetchCourseMetadata([courseId])
  const course = buildEnrolledCourse(
    courseId,
    courseEntries,
    timetableData.audiencesByEntry,
    courseMetadata.get(courseId),
  )

  return {
    course,
    profileIncomplete: false,
  }
}

export function filterEnrolledCourses(courses, { searchQuery = '', categoryFilter = 'all' } = {}) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return courses.filter((course) => {
    const matchesCategory = categoryFilter === 'all'
      || (categoryFilter === 'lab'
        ? LAB_FILTER_CATEGORIES.has(course.category)
        : course.category === categoryFilter)

    if (!matchesCategory) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const searchable = [
      course.code,
      course.name,
      ...course.facultyNames,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchable.includes(normalizedQuery)
  })
}

export function groupCoursesByCategory(courses) {
  const groups = [
    { key: 'core', label: 'Core', courses: [] },
    { key: 'minor', label: 'Minor', courses: [] },
    { key: 'elective', label: 'Electives', courses: [] },
    {
      key: 'lab',
      label: 'Lab / Tutorial / Other',
      courses: [],
    },
  ]

  for (const course of courses) {
    if (course.category === 'core') {
      groups[0].courses.push(course)
    } else if (course.category === 'minor') {
      groups[1].courses.push(course)
    } else if (course.category === 'elective') {
      groups[2].courses.push(course)
    } else {
      groups[3].courses.push(course)
    }
  }

  return groups.filter((group) => group.courses.length > 0)
}
