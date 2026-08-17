/**
 * Mock notifications — replace with Supabase queries in a future stage.
 */

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Classroom change',
    message: 'CS201 lecture moved to Block A – 210 for this week.',
    time: '2 hours ago',
    type: 'info',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Assignment reminder',
    message: 'Database Systems lab submission due Friday, 5:00 PM.',
    time: 'Yesterday',
    type: 'warning',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Campus event',
    message: 'Tech symposium registration opens next Monday.',
    time: '3 days ago',
    type: 'info',
    unread: false,
  },
]

export function getUpcomingNotification(notifications = MOCK_NOTIFICATIONS) {
  return notifications.find((notification) => notification.unread) ?? notifications[0] ?? null
}
