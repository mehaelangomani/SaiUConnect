import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import AppNavigation from '../../common/AppNavigation/AppNavigation'
import HeaderNotificationButton from './HeaderNotificationButton'
import StudentHeader from './StudentHeader'
import { getStudentSectionPath } from '../studentNav'
import './StudentTopBar.css'

function StudentTopBar() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const displayName = profile?.name || profile?.email || 'Student'
  const initial = profile?.initial || displayName.charAt(0).toUpperCase()

  const handleProfileClick = () => {
    navigate(getStudentSectionPath('profile'))
  }

  return (
    <div className="student-top-bar">
      <div className="student-top-bar__nav">
        <AppNavigation />
      </div>

      <div className="student-top-bar__brand">
        <StudentHeader />
      </div>

      <div className="student-top-bar__actions">
        <HeaderNotificationButton />
        <button
          type="button"
          className="student-top-bar__profile-btn"
          onClick={handleProfileClick}
          aria-label={`Open profile for ${displayName}`}
          title="Profile"
        >
          <span className="student-top-bar__avatar" aria-hidden="true">
            {initial}
          </span>
        </button>
      </div>
    </div>
  )
}

export default StudentTopBar
