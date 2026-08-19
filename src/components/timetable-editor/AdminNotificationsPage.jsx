import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdminRequests, updateAdminRequestStatus } from '../../lib/adminRoleService'
import './TimetableProfilePanels.css'

function formatAdminRequest(request) {
  const payload = request.payload ?? {}
  const email = payload.email ?? payload.requester_email ?? payload.user_email
  const name = payload.name ?? payload.requester_name
  if (email && name) {
    return `${request.request_type}: ${name} (${email})`
  }
  if (email) {
    return `${request.request_type}: ${email}`
  }
  return request.request_type
}

function AdminNotificationsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const requestData = await fetchAdminRequests()
      setRequests(requestData)
      setError(null)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingRequests = requests.filter((request) => request.status === 'pending')

  return (
    <div className="timetable-profile">
      <header className="timetable-profile__header">
        <button type="button" className="suc-btn suc-btn--ghost suc-btn--sm" onClick={() => navigate('/admin')}>
          ← Back to timetable
        </button>
        <h1 className="timetable-profile__title">Notifications</h1>
      </header>

      {error && (
        <div className="suc-alert suc-alert--error" role="alert">
          <p>{error.message}</p>
        </div>
      )}

      <section className="timetable-profile__section suc-card">
        {isLoading ? (
          <p>Loading…</p>
        ) : pendingRequests.length === 0 ? (
          <p className="timetable-profile__empty">No pending requests</p>
        ) : (
          <ul className="timetable-profile__list">
            {pendingRequests.map((request) => (
              <li key={request.id}>
                <div>
                  <strong>{formatAdminRequest(request)}</strong>
                </div>
                <div className="timetable-profile__request-actions">
                  <button
                    type="button"
                    className="suc-btn suc-btn--primary suc-btn--sm"
                    onClick={() => updateAdminRequestStatus(request.id, 'accepted').then(loadData)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="suc-btn suc-btn--secondary suc-btn--sm"
                    onClick={() => updateAdminRequestStatus(request.id, 'rejected').then(loadData)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdminNotificationsPage
