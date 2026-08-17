import { MOCK_NOTIFICATIONS } from '../../../data/mockStudentNotifications'
import './StudentNotifications.css'

function StudentNotifications({ compact = false }) {
  return (
    <section
      className={`student-notifications ${compact ? 'student-notifications--compact' : ''}`}
      aria-labelledby="student-notifications-title"
    >
      <div className="student-notifications__header">
        <h2 id="student-notifications-title" className="student-notifications__title">
          Notifications
        </h2>
        {!compact && (
          <span className="suc-badge suc-badge--info">
            {MOCK_NOTIFICATIONS.filter((n) => n.unread).length} unread
          </span>
        )}
      </div>

      <ul className="student-notifications__list">
        {MOCK_NOTIFICATIONS.map((notification) => (
          <li
            key={notification.id}
            className={`student-notifications__item ${
              notification.unread ? 'student-notifications__item--unread' : ''
            }`}
          >
            <div className="student-notifications__item-header">
              <span className="student-notifications__item-title">{notification.title}</span>
              <span className="student-notifications__item-time">{notification.time}</span>
            </div>
            <p className="student-notifications__item-message">{notification.message}</p>
            <span className={`suc-badge suc-badge--${notification.type === 'warning' ? 'warning' : 'info'}`}>
              {notification.type}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default StudentNotifications
