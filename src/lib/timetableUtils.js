export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const WEEKDAY_NAMES = DAY_NAMES.slice(1, 6)

export function formatTimeValue(time) {
  if (!time) {
    return ''
  }

  return String(time).slice(0, 5)
}

export function formatCategoryLabel(category) {
  if (!category) {
    return 'Class'
  }

  return category.charAt(0).toUpperCase() + category.slice(1)
}

function parseTime(time) {
  const [hours, minutes] = formatTimeValue(time).split(':').map(Number)
  return hours * 60 + minutes
}

export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()]
}

export function compareTimetableEntries(a, b) {
  const dayDifference = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)

  if (dayDifference !== 0) {
    return dayDifference
  }

  return parseTime(a.startTime) - parseTime(b.startTime)
}

export function getTodaysClasses(entries = [], date = new Date()) {
  const today = getTodayName(date)

  return entries
    .filter((entry) => entry.day === today)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
}

export function getNextClass(entries = [], date = new Date()) {
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

export function groupTimetableByDay(entries = []) {
  return WEEKDAY_NAMES.map((day) => ({
    day,
    classes: entries
      .filter((entry) => entry.day === day)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
  }))
}
