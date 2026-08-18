export const STUDENT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'timetable', label: 'Timetable', icon: 'timetable' },
  { id: 'free-classrooms', label: 'Free Classrooms', icon: 'classroom' },
  { id: 'faculty', label: 'Faculty', icon: 'faculty' },
  { id: 'courses', label: 'Enrolled Courses', icon: 'courses' },
]

const VALID_SECTIONS = new Set([
  ...STUDENT_NAV_ITEMS.map((item) => item.id),
  'profile',
  'notifications',
  'academic-setup',
])

export function getStudentSectionPath(section) {
  if (section === 'dashboard') {
    return '/student'
  }

  return `/student/${section}`
}

export function getStudentSectionFromPath(pathname) {
  if (pathname === '/student' || pathname === '/student/') {
    return 'dashboard'
  }

  const section = pathname.replace(/^\/student\/?/, '').split('/')[0]
  return VALID_SECTIONS.has(section) ? section : 'dashboard'
}

