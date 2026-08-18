import { createContext, useContext, useMemo, useState } from 'react'
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notificationService'

const StudentNotificationsContext = createContext(null)

function useStudentNotificationsState() {
  const [notifications, setNotifications] = useState([])

  const unreadCount = useMemo(
    () => getUnreadNotificationCount(notifications),
    [notifications],
  )

  const markAsRead = (notificationId) => {
    setNotifications((current) => markNotificationRead(current, notificationId))
  }

  const markAllAsRead = () => {
    setNotifications((current) => markAllNotificationsRead(current))
  }

  return {
    notifications,
    unreadCount,
    isLoading: false,
    markAsRead,
    markAllAsRead,
  }
}

export function StudentNotificationsProvider({ children }) {
  const value = useStudentNotificationsState()

  return (
    <StudentNotificationsContext.Provider value={value}>
      {children}
    </StudentNotificationsContext.Provider>
  )
}

export function useStudentNotifications() {
  const context = useContext(StudentNotificationsContext)

  if (!context) {
    throw new Error('useStudentNotifications must be used within StudentNotificationsProvider')
  }

  return context
}
