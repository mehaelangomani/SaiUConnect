import { useAuth } from '../../../auth/AuthContext'
import { useStudentTimetable } from '../../../hooks/useStudentTimetable'
import { MOCK_ACADEMIC_INFO } from '../../../data/mockStudentTimetable'
import { getNextClass, getTodaysClasses } from '../../../lib/timetableUtils'
import { getUpcomingNotification } from '../../../data/mockStudentNotifications'
import {
  ACADEMIC_YEAR_OPTIONS,
  getOptionLabel,
  SEMESTER_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import './StudentOverview.css'

function StudentOverview() {
  const { profile } = useAuth()
  const { entries, isLoading } = useStudentTimetable()
  const todaysClasses = getTodaysClasses(entries)
  const nextClass = getNextClass(entries)
  const upcomingNotification = getUpcomingNotification()

  const semesterDisplay = profile?.semester
    ? getOptionLabel(SEMESTER_OPTIONS, profile.semester)
    : MOCK_ACADEMIC_INFO.semester

  const yearDisplay = profile?.academic_year
    ? getOptionLabel(ACADEMIC_YEAR_OPTIONS, profile.academic_year)
    : MOCK_ACADEMIC_INFO.year

  return (
    <section className="student-overview suc-animate-fade-in-up" aria-label="Dashboard overview">
      <div className="student-overview__grid">
        <OverviewCard
          label="Today's classes"
          value={isLoading ? '…' : String(todaysClasses.length)}
          detail={
            isLoading
              ? 'Loading schedule'
              : todaysClasses.length === 1
                ? 'class scheduled'
                : 'classes scheduled'
          }
        />
        <OverviewCard
          label="Next class"
          value={isLoading ? '…' : (nextClass?.courseCode ?? '—')}
          detail={
            isLoading
              ? 'Loading schedule'
              : nextClass
                ? `${nextClass.startTime} · ${nextClass.room}`
                : 'No upcoming class'
          }
          highlight
        />
        <OverviewCard
          label="Current semester"
          value={semesterDisplay}
          detail="Academic term"
        />
        <OverviewCard
          label="Current year"
          value={yearDisplay}
          detail={profile?.school ?? 'School not set'}
        />
        <OverviewCard
          label="Course / program"
          value={MOCK_ACADEMIC_INFO.program}
          detail="Enrolled program"
          wide
        />
        <OverviewCard
          label="Upcoming notification"
          value={upcomingNotification?.title ?? 'None'}
          detail={upcomingNotification?.message ?? 'No new notifications'}
          wide
          notification
        />
      </div>
    </section>
  )
}

function OverviewCard({ label, value, detail, highlight, wide, notification }) {
  return (
    <article
      className={`student-overview__card suc-card ${
        highlight ? 'student-overview__card--highlight' : ''
      } ${wide ? 'student-overview__card--wide' : ''} ${
        notification ? 'student-overview__card--notification' : ''
      }`}
    >
      <span className="student-overview__label">{label}</span>
      <p className="student-overview__value">{value}</p>
      <p className="student-overview__detail">{detail}</p>
    </article>
  )
}

export default StudentOverview
