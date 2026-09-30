import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  fetchAdminRequests,
  reviewEditorAccessRequest,
  updateAdminRequestStatus,
} from '../../lib/adminRoleService'

import {
  EDITOR_ACCESS_REQUEST_TYPE,
} from '../../lib/editorRequestService'

import {
  fetchAdminPRNChangeRequests,
  reviewPRNChangeRequest,
  updateStudentPRNFromRequest,
} from '../../lib/prnChangeRequestService'

import './TimetableProfilePanels.css'

function formatAdminRequest(request) {
  const payload = request.payload ?? {}

  const email =
    payload.email ??
    payload.requester_email ??
    payload.user_email

  const name =
    payload.name ??
    payload.requester_name

  if (request.request_type === EDITOR_ACCESS_REQUEST_TYPE) {
    const facultyName =
      name ||
      email ||
      'A faculty member'

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

function formatPRNRequest(request) {
  const student = request.student

  const studentName =
    student?.name?.trim() ||
    student?.email?.trim() ||
    'A student'

  return `${studentName} has requested a PRN change.`
}

function AdminNotificationsPage() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [prnRequests, setPRNRequests] = useState([])

  const [editingPRNRequestId, setEditingPRNRequestId] =
    useState(null)

  const [editingPRNValue, setEditingPRNValue] =
    useState('')

  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPRN, setIsSavingPRN] = useState(false)

  const loadData = async () => {
    setIsLoading(true)

    try {
      const [
        requestData,
        prnRequestData,
      ] = await Promise.all([
        fetchAdminRequests(),
        fetchAdminPRNChangeRequests(),
      ])

      setRequests(requestData)
      setPRNRequests(prnRequestData)

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

      if (
        request.request_type ===
        EDITOR_ACCESS_REQUEST_TYPE
      ) {
        await reviewEditorAccessRequest(
          request.id,
          decision,
        )
      } else {
        await updateAdminRequestStatus(
          request.id,
          decision === 'approved'
            ? 'accepted'
            : 'rejected',
        )
      }

      await loadData()
    } catch (reviewError) {
      setError(reviewError)
    }
  }

  const handlePRNReview = async (
    request,
    decision,
  ) => {
    try {
      setError(null)

      await reviewPRNChangeRequest(
        request.id,
        decision,
      )

      await loadData()
    } catch (reviewError) {
      setError(reviewError)
    }
  }

  const startPRNEdit = (request) => {
    setEditingPRNRequestId(request.id)

    setEditingPRNValue(
      request.requested_prn ?? '',
    )

    setError(null)
  }

  const cancelPRNEdit = () => {
    setEditingPRNRequestId(null)
    setEditingPRNValue('')
  }

  const handleSavePRN = async (request) => {
    try {
      setError(null)

      const trimmedPRN =
        editingPRNValue.trim()

      if (!trimmedPRN) {
        setError('Please enter a PRN.')
        return
      }

      setIsSavingPRN(true)

      await updateStudentPRNFromRequest({
        requestId: request.id,
        studentId: request.student_id,
        newPRN: trimmedPRN,
      })

      cancelPRNEdit()

      await loadData()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setIsSavingPRN(false)
    }
  }

  const pendingRequests = requests.filter(
    (request) =>
      request.status === 'pending',
  )

  const pendingPRNRequests = prnRequests.filter(
    (request) =>
      request.status === 'pending',
  )

  const approvedPRNRequests = prnRequests.filter(
    (request) =>
      request.status === 'approved',
  )

  const totalPending =
    pendingRequests.length +
    pendingPRNRequests.length

  return (
    <div className="timetable-profile">
      <header className="timetable-profile__header">
        <button
          type="button"
          className="suc-btn suc-btn--ghost suc-btn--sm"
          onClick={() => navigate('/admin')}
        >
          ← Back to timetable
        </button>

        <h1 className="timetable-profile__title">
          Notifications
        </h1>
      </header>

      {error && (
        <div
          className="suc-alert suc-alert--error"
          role="alert"
        >
          <p>
            {error.message ||
              'Something went wrong.'}
          </p>
        </div>
      )}

      <section className="timetable-profile__section suc-card">
        <h2>Pending Requests</h2>

        {isLoading ? (
          <p>Loading…</p>
        ) : totalPending === 0 ? (
          <p className="timetable-profile__empty">
            No pending requests
          </p>
        ) : (
          <>
            {/* Existing admin/editor requests */}
            {pendingRequests.length > 0 && (
              <div>
                {pendingRequests.map(
                  (request) => (
                    <div
                      key={`admin-${request.id}`}
                      style={{
                        padding:
                          '16px 0',
                        borderBottom:
                          '1px solid var(--suc-color-border)',
                      }}
                    >
                      <div>
                        <strong>
                          {formatAdminRequest(
                            request,
                          )}
                        </strong>
                      </div>

                      <div
                        className="timetable-profile__request-actions"
                        style={{
                          marginTop: '10px',
                        }}
                      >
                        <button
                          type="button"
                          className="suc-btn suc-btn--primary suc-btn--sm"
                          onClick={() =>
                            handleReview(
                              request,
                              'approved',
                            )
                          }
                        >
                          {request.request_type ===
                          EDITOR_ACCESS_REQUEST_TYPE
                            ? 'Approve'
                            : 'Accept'}
                        </button>

                        <button
                          type="button"
                          className="suc-btn suc-btn--secondary suc-btn--sm"
                          onClick={() =>
                            handleReview(
                              request,
                              'rejected',
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {/* PRN requests */}
            {pendingPRNRequests.length > 0 && (
              <div>
                {pendingPRNRequests.map(
                  (request) => {
                    const student =
                      request.student

                    return (
                      <div
                        key={`prn-${request.id}`}
                        style={{
                          padding:
                            '16px 0',
                          borderBottom:
                            '1px solid var(--suc-color-border)',
                        }}
                      >
                        <div>
                          <strong>
                            {formatPRNRequest(
                              request,
                            )}
                          </strong>

                          <div
                            style={{
                              marginTop:
                                '8px',
                              fontSize:
                                '14px',
                              lineHeight:
                                '1.6',
                            }}
                          >
                            <div>
                              <strong>
                                Email:
                              </strong>{' '}
                              {student?.email ||
                                '—'}
                            </div>

                            <div>
                              <strong>
                                Current PRN:
                              </strong>{' '}
                              {request.current_prn ||
                                '—'}
                            </div>

                            <div>
                              <strong>
                                Requested PRN:
                              </strong>{' '}
                              {request.requested_prn ||
                                '—'}
                            </div>

                            <div>
                              <strong>
                                Reason:
                              </strong>{' '}
                              {request.reason ||
                                'No reason provided.'}
                            </div>
                          </div>
                        </div>

                        <div
                          className="timetable-profile__request-actions"
                          style={{
                            marginTop:
                              '12px',
                          }}
                        >
                          <button
                            type="button"
                            className="suc-btn suc-btn--primary suc-btn--sm"
                            onClick={() =>
                              handlePRNReview(
                                request,
                                'approved',
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className="suc-btn suc-btn--secondary suc-btn--sm"
                            onClick={() =>
                              handlePRNReview(
                                request,
                                'rejected',
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Approved PRN requests waiting for the admin to enter
          the final PRN value. */}
      {approvedPRNRequests.length > 0 && (
        <section className="timetable-profile__section suc-card">
          <h2>Approved PRN Changes</h2>

          {approvedPRNRequests.map(
            (request) => {
              const student =
                request.student

              const isEditing =
                editingPRNRequestId ===
                request.id

              return (
                <div
                  key={`approved-prn-${request.id}`}
                  style={{
                    padding:
                      '16px 0',
                    borderBottom:
                      '1px solid var(--suc-color-border)',
                  }}
                >
                  <div>
                    <strong>
                      {student?.name ||
                        student?.email ||
                        'Student'}
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '8px',
                        fontSize:
                          '14px',
                        lineHeight:
                          '1.6',
                      }}
                    >
                      <div>
                        <strong>
                          Email:
                        </strong>{' '}
                        {student?.email ||
                          '—'}
                      </div>

                      <div>
                        <strong>
                          Old PRN:
                        </strong>{' '}
                        {request.current_prn ||
                          '—'}
                      </div>

                      <div>
                        <strong>
                          Requested PRN:
                        </strong>{' '}
                        {request.requested_prn ||
                          '—'}
                      </div>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div
                      className="timetable-profile__request-actions"
                      style={{
                        marginTop:
                          '12px',
                      }}
                    >
                      <button
                        type="button"
                        className="suc-btn suc-btn--primary suc-btn--sm"
                        onClick={() =>
                          startPRNEdit(
                            request,
                          )
                        }
                      >
                        Edit PRN
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop:
                          '12px',
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        gap: '10px',
                        maxWidth:
                          '420px',
                      }}
                    >
                      <label
                        htmlFor={`prn-${request.id}`}
                        style={{
                          fontWeight:
                            500,
                        }}
                      >
                        New PRN
                      </label>

                      <input
                        id={`prn-${request.id}`}
                        className="suc-input"
                        type="text"
                        value={
                          editingPRNValue
                        }
                        onChange={(
                          event,
                        ) =>
                          setEditingPRNValue(
                            event.target
                              .value,
                          )
                        }
                        disabled={
                          isSavingPRN
                        }
                      />

                      <div
                        className="timetable-profile__request-actions"
                      >
                        <button
                          type="button"
                          className="suc-btn suc-btn--primary suc-btn--sm"
                          onClick={() =>
                            handleSavePRN(
                              request,
                            )
                          }
                          disabled={
                            isSavingPRN
                          }
                        >
                          {isSavingPRN
                            ? 'Saving…'
                            : 'Save PRN'}
                        </button>

                        <button
                          type="button"
                          className="suc-btn suc-btn--secondary suc-btn--sm"
                          onClick={
                            cancelPRNEdit
                          }
                          disabled={
                            isSavingPRN
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            },
          )}
        </section>
      )}
    </div>
  )
}

export default AdminNotificationsPage