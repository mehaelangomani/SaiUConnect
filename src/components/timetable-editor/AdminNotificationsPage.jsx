import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdminRequests, reviewEditorAccessRequest, updateAdminRequestStatus } from '../../lib/adminRoleService'
import { EDITOR_ACCESS_REQUEST_TYPE } from '../../lib/editorRequestService'
import './TimetableProfilePanels.css'

function formatAdminRequest(request) {
  const payload = request.payload ?? {}
  const email = payload.email ?? payload.requester_email ?? payload.user_email
  const name = payload.name ?? payload.requester_name

  if (request.request_type === EDITOR_ACCESS_REQUEST_TYPE) {
    const facultyName = name || email || 'A faculty member'
    return `${facultyName} has requested editor access.`
  }

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

  const handleReview = async (request, decision) => {
    try {
      setError(null)
      if (request.request_type === EDITOR_ACCESS_REQUEST_TYPE) {
        await reviewEditorAccessRequest(request.id, decision)
      } else {
        await updateAdminRequestStatus(
          request.id,
          decision === 'approved' ? 'accepted' : 'rejected',
        )
      }
      await loadData()
    } catch (reviewError) {
      setError(reviewError)
    }
  }

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
                    onClick={() => handleReview(request, 'approved')}
                  >
                    {request.request_type === EDITOR_ACCESS_REQUEST_TYPE ? 'Approve' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    className="suc-btn suc-btn--secondary suc-btn--sm"
                    onClick={() => handleReview(request, 'rejected')}
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
