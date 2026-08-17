import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageBackground from '../../components/PageBackground/PageBackground'
import StudentHeader from '../../components/student/StudentHeader/StudentHeader'
import StudentSidebar from '../../components/student/StudentSidebar/StudentSidebar'
import StudentOverview from '../../components/student/StudentOverview/StudentOverview'
import TodaysSchedule from '../../components/student/TodaysSchedule/TodaysSchedule'
import NextClass from '../../components/student/NextClass/NextClass'
import QuickActions from '../../components/student/QuickActions/QuickActions'
import StudentTimetable from '../../components/student/StudentTimetable/StudentTimetable'
import StudentNotifications from '../../components/student/StudentNotifications/StudentNotifications'
import StudentProfilePanel from '../../components/student/StudentProfilePanel/StudentProfilePanel'
import StudentPlaceholder from '../../components/student/StudentPlaceholder/StudentPlaceholder'
import AcademicSetupEditor from '../../components/student/AcademicSetup/AcademicSetupEditor'
import { getStudentSectionFromPath, getStudentSectionPath } from '../../components/student/studentNav'
import { StudentTimetableProvider } from '../../hooks/useStudentTimetable'
import './StudentDashboard.css'

function StudentDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeSection = getStudentSectionFromPath(location.pathname)

  const handleNavigate = (section) => {
    navigate(getStudentSectionPath(section))
    setSidebarOpen(false)
  }

  return (
    <StudentTimetableProvider>
      <PageBackground variant="dashboard" watermarkVariant="corner">
        <div className="student-dashboard">
          <StudentHeader
            onMenuToggle={() => setSidebarOpen((open) => !open)}
            showMenuButton
          />

          <div className="student-dashboard__body">
            <StudentSidebar
              activeSection={activeSection}
              onNavigate={handleNavigate}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <div className="student-dashboard__main">
              <div className="student-dashboard__content">
                {renderSection(activeSection, handleNavigate)}
              </div>

              {activeSection === 'dashboard' && (
                <aside className="student-dashboard__notifications" aria-label="Notifications panel">
                  <StudentNotifications compact />
                </aside>
              )}
            </div>
          </div>
        </div>
      </PageBackground>
    </StudentTimetableProvider>
  )
}

function renderSection(section, onNavigate) {
  switch (section) {
    case 'dashboard':
      return (
        <>
          <header className="student-dashboard__welcome suc-animate-fade-in-down">
            <h1 className="student-dashboard__welcome-title">Student Dashboard</h1>
            <p className="student-dashboard__welcome-text">
              Your personalized overview for timetables, classrooms, and campus updates.
            </p>
          </header>

          <StudentOverview />

          <div className="student-dashboard__split">
            <TodaysSchedule />
            <NextClass />
          </div>

          <QuickActions onNavigate={onNavigate} />
        </>
      )

    case 'timetable':
      return <StudentTimetable />

    case 'free-classrooms':
      return (
        <StudentPlaceholder
          title="Free Classrooms"
          description="Search for available classrooms across campus. This feature will connect to live availability data in a future release."
        />
      )

    case 'faculty':
      return (
        <StudentPlaceholder
          title="Faculty Directory"
          description="Find faculty members, office hours, and contact details. Coming in a future release."
        />
      )

    case 'courses':
      return (
        <StudentPlaceholder
          title="My Courses"
          description="View your enrolled courses, credits, and academic progress. Coming in a future release."
        />
      )

    case 'profile':
      return <StudentProfilePanel />

    case 'academic-setup':
      return <AcademicSetupEditor />

    case 'notifications':
      return <StudentNotifications />

    default:
      return null
  }
}

export default StudentDashboard
