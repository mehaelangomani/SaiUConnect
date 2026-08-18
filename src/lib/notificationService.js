export const NOTIFICATION_TYPES = {
  CLASSROOM_CHANGE: 'classroom_change',
}

/**
 * Local notification shape ready for future Supabase mapping.
 *
 * @typedef {Object} StudentNotification
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {string|null} courseCode
 * @property {string|null} courseName
 * @property {string|null} previousRoom
 * @property {string|null} newRoom
 * @property {string|null} facultyName
 * @property {string|null} date
 * @property {string|null} startTime
 * @property {string|null} endTime
 * @property {string} createdAt
 * @property {boolean} isRead
 */

function parseTimeValue(time) {
  if (!time) {
    return 0
  }

  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

export function normalizeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title ?? '',
    message: notification.message ?? '',
    courseCode: notification.courseCode ?? null,
    courseName: notification.courseName ?? null,
    previousRoom: notification.previousRoom ?? null,
    newRoom: notification.newRoom ?? null,
    facultyName: notification.facultyName ?? null,
    date: notification.date ?? null,
    startTime: notification.startTime ?? null,
    endTime: notification.endTime ?? null,
    createdAt: notification.createdAt,
    isRead: Boolean(notification.isRead),
  }
}

/**
 * Returns student notifications from local state.
 * Replace with Supabase queries in a future release.
 */
export function getStudentNotifications(notifications = []) {
  return notifications.map(normalizeNotification)
}

export function getUnreadNotificationCount(notifications = []) {
  return notifications.filter((notification) => !notification.isRead).length
}

export function markNotificationRead(notifications, notificationId) {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification,
  )
}

export function markAllNotificationsRead(notifications) {
  return notifications.map((notification) => ({ ...notification, isRead: true }))
}

export function formatNotificationRelativeTime(createdAt, now = new Date()) {
  if (!createdAt) {
    return ''
  }

  const createdDate = new Date(createdAt)
  const diffMs = now.getTime() - createdDate.getTime()

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return ''
  }

  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  return createdDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatNotificationSchedule(notification) {
  const parts = []

  if (notification.date) {
    parts.push(notification.date)
  }

  if (notification.startTime && notification.endTime) {
    parts.push(`${notification.startTime} – ${notification.endTime}`)
  } else if (notification.startTime) {
    parts.push(notification.startTime)
  }

  return parts.join(' • ')
}

export function formatRoomChange(notification) {
  if (!notification.previousRoom && !notification.newRoom) {
    return null
  }

  if (notification.previousRoom && notification.newRoom) {
    return `${notification.previousRoom} → ${notification.newRoom}`
  }

  return notification.newRoom ?? notification.previousRoom
}

export function compareNotifications(left, right) {
  const leftTime = new Date(left.createdAt).getTime()
  const rightTime = new Date(right.createdAt).getTime()

  if (leftTime !== rightTime) {
    return rightTime - leftTime
  }

  const leftSchedule = parseTimeValue(left.startTime)
  const rightSchedule = parseTimeValue(right.startTime)

  return leftSchedule - rightSchedule
}
