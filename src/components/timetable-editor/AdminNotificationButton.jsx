import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdminRequests } from '../../lib/adminRoleService'
import './AdminNotificationButton.css'

function BellIcon() {
  return (
    <svg
      className="admin-notification-btn__icon"
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

function AdminNotificationButton() {
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadPendingCount() {
      try {
        const requests = await fetchAdminRequests()
        if (!cancelled) {
          setPendingCount(requests.filter((request) => request.status === 'pending').length)
        }
      } catch {
        if (!cancelled) {
          setPendingCount(0)
        }
      }
    }

    loadPendingCount()
    return () => {
      cancelled = true
    }
  }, [])

  const handleClick = () => {
    navigate('/admin/notifications')
  }

  return (
    <button
      type="button"
      className="admin-notification-btn"
      onClick={handleClick}
      aria-label={pendingCount > 0 ? `Notifications (${pendingCount} pending)` : 'Notifications'}
      title="Notifications"
    >
      <BellIcon />
      {pendingCount > 0 && <span className="admin-notification-btn__badge" aria-hidden="true" />}
    </button>
  )
}

export default AdminNotificationButton
