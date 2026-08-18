import { useAuth } from '../../../auth/AuthContext'
import {
  ACADEMIC_YEAR_OPTIONS,
  getOptionLabel,
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  NONE_OPTION_VALUE,
  SECTION_OPTIONS,
  SEMESTER_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import { getStudentFirstName, getTimeGreeting } from '../../../lib/greetingUtils'
import './DashboardWelcome.css'

function SummaryItem({ label, value }) {
  if (!value) {
    return null
  }

  return (
    <div className="dashboard-welcome__summary-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function DashboardWelcome({ enrolledCount, enrolledLoading }) {
  const { profile } = useAuth()
  const greeting = getTimeGreeting()
  const firstName = getStudentFirstName(profile)

  const yearDisplay = getOptionLabel(ACADEMIC_YEAR_OPTIONS, profile?.academic_year)
  const semesterDisplay = getOptionLabel(SEMESTER_OPTIONS, profile?.semester)
  const sectionDisplay = getOptionLabel(SECTION_OPTIONS, profile?.section)
  const labDisplay = getOptionLabel(LAB_GROUP_OPTIONS, profile?.lab_group)
  const minorDisplay = profile?.minor && profile.minor !== NONE_OPTION_VALUE
    ? getOptionLabel(MINOR_OPTIONS, profile.minor)
    : null

  const enrolledDisplay = enrolledLoading
    ? '…'
    : `${enrolledCount ?? 0} ${enrolledCount === 1 ? 'course' : 'courses'}`

  return (
    <header className="dashboard-welcome suc-card suc-animate-fade-in-down">
      <div className="dashboard-welcome__intro">
        <p className="dashboard-welcome__greeting">{greeting},</p>
        <h1 className="dashboard-welcome__title">{firstName}</h1>
        <p className="dashboard-welcome__subtitle">
          Your personalized overview for timetables, classrooms, and campus updates.
        </p>
      </div>

      <dl className="dashboard-welcome__summary" aria-label="Academic summary">
        <SummaryItem label="Academic year" value={yearDisplay !== 'None' ? yearDisplay : null} />
        <SummaryItem label="Semester" value={semesterDisplay !== 'None' ? semesterDisplay : null} />
        <SummaryItem label="Section" value={sectionDisplay !== 'None' ? sectionDisplay : null} />
        <SummaryItem label="Lab group" value={labDisplay !== 'None' ? labDisplay : null} />
        {minorDisplay && <SummaryItem label="Minor" value={minorDisplay} />}
        <SummaryItem label="Enrolled courses" value={enrolledDisplay} />
      </dl>
    </header>
  )
}

export default DashboardWelcome
