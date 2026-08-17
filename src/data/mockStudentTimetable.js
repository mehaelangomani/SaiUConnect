/**
 * Mock timetable data — replace with Supabase queries in a future stage.
 * Components consume the normalized shape below, not raw mock arrays.
 */

export const MOCK_ACADEMIC_INFO = {
  semester: 'Spring 2026',
  year: 'Year 2',
  program: 'B.Tech Computer Science',
}

export const MOCK_TIMETABLE_ENTRIES = [
  {
    id: 'cls-1',
    courseCode: 'CS201',
    courseName: 'Data Structures',
    faculty: 'Dr. Priya Sharma',
    room: 'Block A – 204',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    type: 'Lecture',
  },
  {
    id: 'cls-2',
    courseCode: 'MA105',
    courseName: 'Linear Algebra',
    faculty: 'Prof. Arjun Mehta',
    room: 'Block B – 101',
    day: 'Monday',
    startTime: '11:00',
    endTime: '12:30',
    type: 'Lecture',
  },
  {
    id: 'cls-3',
    courseCode: 'CS203',
    courseName: 'Database Systems',
    faculty: 'Dr. Kavitha Nair',
    room: 'Lab C – 302',
    day: 'Monday',
    startTime: '14:00',
    endTime: '15:30',
    type: 'Lab',
  },
  {
    id: 'cls-4',
    courseCode: 'HU102',
    courseName: 'Technical Communication',
    faculty: 'Ms. Rhea Das',
    room: 'Block A – 110',
    day: 'Tuesday',
    startTime: '10:00',
    endTime: '11:00',
    type: 'Seminar',
  },
  {
    id: 'cls-5',
    courseCode: 'CS205',
    courseName: 'Operating Systems',
    faculty: 'Dr. Vikram Singh',
    room: 'Block A – 208',
    day: 'Wednesday',
    startTime: '09:00',
    endTime: '10:30',
    type: 'Lecture',
  },
  {
    id: 'cls-6',
    courseCode: 'CS207',
    courseName: 'Computer Networks',
    faculty: 'Dr. Ananya Iyer',
    room: 'Lab C – 305',
    day: 'Thursday',
    startTime: '13:00',
    endTime: '14:30',
    type: 'Lab',
  },
  {
    id: 'cls-7',
    courseCode: 'CS201',
    courseName: 'Data Structures',
    faculty: 'Dr. Priya Sharma',
    room: 'Block A – 204',
    day: 'Friday',
    startTime: '11:00',
    endTime: '12:30',
    type: 'Tutorial',
  },
]

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function parseTime(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()]
}

export function getTodaysClasses(entries = MOCK_TIMETABLE_ENTRIES, date = new Date()) {
  const today = getTodayName(date)
  return entries
    .filter((entry) => entry.day === today)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
}

export function getNextClass(entries = MOCK_TIMETABLE_ENTRIES, date = new Date()) {
  const todaysClasses = getTodaysClasses(entries, date)
  const nowMinutes = date.getHours() * 60 + date.getMinutes()

  const upcomingToday = todaysClasses.find(
    (entry) => parseTime(entry.endTime) > nowMinutes,
  )

  if (upcomingToday) {
    return upcomingToday
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const futureDate = new Date(date)
    futureDate.setDate(date.getDate() + offset)
    const futureDay = getTodayName(futureDate)
    const futureClasses = entries
      .filter((entry) => entry.day === futureDay)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))

    if (futureClasses.length > 0) {
      return futureClasses[0]
    }
  }

  return null
}

export function groupTimetableByDay(entries = MOCK_TIMETABLE_ENTRIES) {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  return weekdays.map((day) => ({
    day,
    classes: entries
      .filter((entry) => entry.day === day)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
  }))
}
