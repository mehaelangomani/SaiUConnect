import { useEffect, useState } from 'react'
import {
  createPRNChangeRequest,
  fetchMyPendingPRNChangeRequest,
} from '../../../lib/prnChangeRequestService'
import './PRNChangeRequest.css'

function PRNChangeRequest({ profile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [requestedPRN, setRequestedPRN] = useState('')
  const [reason, setReason] = useState('')
  const [pendingRequest, setPendingRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPendingRequest = async () => {
      if (!profile?.id) {
        setIsLoading(false)
        return
      }

      try {
        const request = await fetchMyPendingPRNChangeRequest(profile.id)

        if (isMounted) {
          setPendingRequest(request)
        }
      } catch {
        if (isMounted) {
          setError('Unable to check your PRN change request status.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPendingRequest()

    return () => {
      isMounted = false
    }
  }, [profile?.id])

  const handleOpen = () => {
    setError('')
    setSuccess('')
    setRequestedPRN('')
    setReason('')
    setIsOpen(true)
  }

  const handleClose = () => {
    if (isSubmitting) return

    setIsOpen(false)
    setError('')
    setRequestedPRN('')
    setReason('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const trimmedPRN = requestedPRN.trim()
    const trimmedReason = reason.trim()

    if (!trimmedPRN) {
      setError('Please enter the PRN you want to request.')
      return
    }

    if (!trimmedReason) {
      setError('Please provide a reason for the PRN change.')
      return
    }

    setIsSubmitting(true)

    try {
      const request = await createPRNChangeRequest({
        studentId: profile.id,
        currentPRN: profile.prn,
        requestedPRN: trimmedPRN,
        reason: trimmedReason,
      })

      setPendingRequest(request)
      setSuccess(
        'Your PRN change request has been submitted to the admin.',
      )
      setRequestedPRN('')
      setReason('')
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Unable to submit your PRN change request.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="prn-change-request">
        <div className="prn-change-request__header">
          <div>
            <h3 className="prn-change-request__title">
              PRN
            </h3>
            <p className="prn-change-request__description">
              Checking your PRN change request status...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="prn-change-request">
        <div className="prn-change-request__header">
          <div>
            <h3 className="prn-change-request__title">
              PRN
            </h3>

            <p className="prn-change-request__description">
              Your current PRN can only be changed by an admin.
            </p>
          </div>

          <span className="prn-change-request__current">
            {profile?.prn?.trim() || 'Not set'}
          </span>
        </div>

        {pendingRequest && (
          <div className="prn-change-request__pending">
            <div>
              <strong>PRN change request pending</strong>
              <p>
                Your request for{' '}
                <strong>{pendingRequest.requested_prn}</strong>{' '}
                is waiting for admin approval.
              </p>
            </div>

            <span className="prn-change-request__status">
              Pending
            </span>
          </div>
        )}

        {success && (
          <div className="prn-change-request__success">
            {success}
          </div>
        )}

        {!pendingRequest && (
          <button
            type="button"
            className="prn-change-request__button"
            onClick={handleOpen}
          >
            Request PRN Change
          </button>
        )}
      </section>

      {isOpen && (
        <div
          className="prn-change-request__overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose()
            }
          }}
        >
          <div
            className="prn-change-request__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prn-change-request-title"
          >
            <div className="prn-change-request__modal-header">
              <div>
                <h2 id="prn-change-request-title">
                  Request PRN Change
                </h2>

                <p>
                  Submit the new PRN you want the admin to review.
                </p>
              </div>

              <button
                type="button"
                className="prn-change-request__close"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="prn-change-request__current-box">
              <span>Current PRN</span>
              <strong>
                {profile?.prn?.trim() || 'Not set'}
              </strong>
            </div>

            <form
              className="prn-change-request__form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="requested-prn">
                Requested PRN
              </label>

              <input
                id="requested-prn"
                type="text"
                value={requestedPRN}
                onChange={(event) =>
                  setRequestedPRN(event.target.value)
                }
                placeholder="Enter your new PRN"
                autoComplete="off"
                disabled={isSubmitting}
              />

              <label htmlFor="prn-change-reason">
                Reason
              </label>

              <textarea
                id="prn-change-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Explain why your PRN needs to be changed"
                rows={4}
                disabled={isSubmitting}
              />

              {error && (
                <div className="prn-change-request__error">
                  {error}
                </div>
              )}

              <div className="prn-change-request__actions">
                <button
                  type="button"
                  className="prn-change-request__cancel"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="prn-change-request__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default PRNChangeRequest