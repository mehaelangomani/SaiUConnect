import { useMemo } from 'react'
import { useStudentNotifications } from '../../../hooks/useStudentNotifications'
import {
  compareNotifications,
  formatNotificationRelativeTime,
  formatNotificationSchedule,
  formatRoomChange,
  NOTIFICATION_TYPES,
} from '../../../lib/notificationService'
import './Notifications.css'

function NotificationsEmptyState() {
  return (
    <div className="notifications__empty-state suc-card" role="status">
      <p className="notifications__empty-title">No new notifications</p>
      <p className="notifications__empty-text">
        Classroom and timetable changes will appear here.
      </p>
    </div>
  )
}

function formatCourseLabel(notification) {
  if (notification.courseName && notification.courseCode) {
    return `${notification.courseName} (${notification.courseCode})`
  }

  return notification.courseName ?? notification.courseCode ?? null
}

function ClassroomChangeCard({ notification, onMarkRead }) {
  const roomChange = formatRoomChange(notification)
  const scheduleLabel = formatNotificationSchedule(notification)
  const courseLabel = formatCourseLabel(notification)

  return (
    <article
      className={`notifications__card suc-card ${
        !notification.isRead ? 'notifications__card--unread' : ''
      }`}
    >
      <div className="notifications__card-header">
        <h3 className="notifications__card-title">{notification.title}</h3>
        {!notification.isRead && (
          <button
            type="button"
            className="notifications__mark-read"
            onClick={() => onMarkRead(notification.id)}
          >
            Mark read
          </button>
        )}
      </div>

      {courseLabel && <p className="notifications__course">{courseLabel}</p>}

      {roomChange && (
        <p className="notifications__room-change">{roomChange}</p>
      )}

      {scheduleLabel && (
        <p className="notifications__schedule">{scheduleLabel}</p>
      )}

      {notification.facultyName && (
        <p className="notifications__faculty">{notification.facultyName}</p>
      )}

      {notification.message && (
        <p className="notifications__message">{notification.message}</p>
      )}

      <time className="notifications__time" dateTime={notification.createdAt}>
        {formatNotificationRelativeTime(notification.createdAt)}
      </time>
    </article>
  )
}

function NotificationCard({ notification, onMarkRead }) {
  if (notification.type === NOTIFICATION_TYPES.CLASSROOM_CHANGE) {
    return <ClassroomChangeCard notification={notification} onMarkRead={onMarkRead} />
  }

  return (
    <article
      className={`notifications__card suc-card ${
        !notification.isRead ? 'notifications__card--unread' : ''
      }`}
    >
      <div className="notifications__card-header">
        <h3 className="notifications__card-title">{notification.title}</h3>
        {!notification.isRead && (
          <button
            type="button"
            className="notifications__mark-read"
            onClick={() => onMarkRead(notification.id)}
          >
            Mark read
          </button>
        )}
      </div>

      {notification.message && (
        <p className="notifications__message">{notification.message}</p>
      )}

      <time className="notifications__time" dateTime={notification.createdAt}>
        {formatNotificationRelativeTime(notification.createdAt)}
      </time>
    </article>
  )
}

function Notifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useStudentNotifications()

  const sortedNotifications = useMemo(
    () => [...notifications].sort(compareNotifications),
    [notifications],
  )

  return (
    <section className="notifications" aria-labelledby="notifications-title">
      <div className="notifications__header">
        <div>
          <h2 id="notifications-title" className="notifications__title">
            Notifications
          </h2>
          <p className="notifications__subtitle">
            Stay updated with classroom and timetable changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="suc-btn suc-btn--ghost suc-btn--sm"
            onClick={markAllAsRead}
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="notifications__status" role="status" aria-live="polite">
          <span className="suc-spinner suc-spinner--dark" aria-hidden="true" />
          <p>Loading notifications…</p>
        </div>
      )}

      {!isLoading && sortedNotifications.length === 0 && <NotificationsEmptyState />}

      {!isLoading && sortedNotifications.length > 0 && (
        <ul className="notifications__list">
          {sortedNotifications.map((notification) => (
            <li key={notification.id}>
              <NotificationCard notification={notification} onMarkRead={markAsRead} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Notifications
