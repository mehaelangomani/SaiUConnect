import { useLocation, useNavigate } from 'react-router-dom'
import PageBackground from '../../components/PageBackground/PageBackground'
import StudentTopBar from '../../components/student/StudentHeader/StudentTopBar'
import StudentHeader from '../../components/student/StudentHeader/StudentHeader'
import StudentSidebar from '../../components/student/StudentSidebar/StudentSidebar'
import StudentDashboardHome from '../../components/student/StudentDashboardHome/StudentDashboardHome'
import StudentTimetable from '../../components/student/StudentTimetable/StudentTimetable'
import Notifications from '../../components/student/Notifications/Notifications'
import StudentProfilePanel from '../../components/student/StudentProfilePanel/StudentProfilePanel'
import FreeClassrooms from '../../components/student/FreeClassrooms/FreeClassrooms'
import FacultyDirectory from '../../components/student/FacultyDirectory/FacultyDirectory'
import EnrolledCourses from '../../components/student/EnrolledCourses/EnrolledCourses'
import AcademicSetupEditor from '../../components/student/AcademicSetup/AcademicSetupEditor'
import { getStudentSectionFromPath, getStudentSectionPath } from '../../components/student/studentNav'
import { StudentTimetableProvider } from '../../hooks/useStudentTimetable'
import { StudentNotificationsProvider } from '../../hooks/useStudentNotifications'
import './StudentDashboard.css'

function StudentDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = getStudentSectionFromPath(location.pathname)

  const handleNavigate = (section) => {
    navigate(getStudentSectionPath(section))
  }

  return (
    <StudentTimetableProvider>
      <StudentNotificationsProvider>
        <PageBackground variant="dashboard" watermarkVariant="corner">
          <div className="student-dashboard">
            <div className="student-dashboard__chrome">
              <StudentTopBar />
              <StudentHeader />
            </div>

            <div className="student-dashboard__body">
              <StudentSidebar
                activeSection={activeSection}
                onNavigate={handleNavigate}
              />

              <div className="student-dashboard__main">
                <div className="student-dashboard__content">
                  {renderSection(activeSection)}
                </div>
              </div>
            </div>
          </div>
        </PageBackground>
      </StudentNotificationsProvider>
    </StudentTimetableProvider>
  )
}

function renderSection(section) {
  switch (section) {
    case 'dashboard':
      return <StudentDashboardHome />

    case 'timetable':
      return <StudentTimetable />

    case 'free-classrooms':
      return <FreeClassrooms />

    case 'faculty':
      return <FacultyDirectory />

    case 'courses':
      return <EnrolledCourses />

    case 'profile':
      return <StudentProfilePanel />

    case 'academic-setup':
      return <AcademicSetupEditor />

    case 'notifications':
      return <Notifications />

    default:
      return null
  }
}

export default StudentDashboard
