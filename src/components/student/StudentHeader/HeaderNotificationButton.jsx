import { useNavigate } from 'react-router-dom'
import { useStudentNotifications } from '../../../hooks/useStudentNotifications'
import { getStudentSectionPath } from '../studentNav'

function BellIcon() {
  return (
    <svg
      className="student-top-bar__bell-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function HeaderNotificationButton() {
  const navigate = useNavigate()
  const { unreadCount } = useStudentNotifications()

  const handleClick = () => {
    navigate(getStudentSectionPath('notifications'))
  }

  return (
    <button
      type="button"
      className="student-top-bar__icon-btn"
      onClick={handleClick}
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      title="Notifications"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <span className="student-top-bar__notification-badge" aria-hidden="true" />
      )}
    </button>
  )
}

export default HeaderNotificationButton
