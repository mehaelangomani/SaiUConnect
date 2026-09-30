import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../../auth/AuthContext'
import { updateAcademicSetup } from '../../../lib/profileService'
import {
  createPRNChangeRequest,
  fetchMyPendingPRNChangeRequest,
} from '../../../lib/prnChangeRequestService'

import ConfirmationDialog from '../../common/ConfirmationDialog/ConfirmationDialog'

import { AcademicSetupFields } from './AcademicSetupFields'

import {
  formDataToPayload,
  hasAcademicSetupChanges,
  profileToFormData,
  validateAcademicSetupForm,
} from './academicSetupUtils'

import { getStudentSectionPath } from '../studentNav'

import './AcademicSetupEditor.css'
import '../AcademicSetup/AcademicSetupForm.css'

function AcademicSetupEditor() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  const initialForm = useMemo(
    () => profileToFormData(profile),
    [profile],
  )

  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [pendingPRNRequest, setPendingPRNRequest] = useState(null)
  const [requestedPRN, setRequestedPRN] = useState('')
  const [prnReason, setPRNReason] = useState('')
  const [isSubmittingPRNRequest, setIsSubmittingPRNRequest] =
    useState(false)
  const [prnRequestMessage, setPRNRequestMessage] = useState('')
  const [prnRequestError, setPRNRequestError] = useState('')

  const hasChanges = hasAcademicSetupChanges(
    initialForm,
    form,
  )

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  useEffect(() => {
    let isMounted = true

    const loadPendingPRNRequest = async () => {
      if (!profile?.id) {
        return
      }

      try {
        const request =
          await fetchMyPendingPRNChangeRequest(profile.id)

        if (isMounted) {
          setPendingPRNRequest(request)
        }
      } catch (requestError) {
        console.error(
          'Failed to load pending PRN request:',
          requestError,
        )

        if (isMounted) {
          setPendingPRNRequest(null)
        }
      }
    }

    loadPendingPRNRequest()

    return () => {
      isMounted = false
    }
  }, [profile?.id])

  const updateField = (field, value) => {
    if (field === 'prn') {
      return
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setError('')
    setSuccessMessage('')
  }

  const handleCancel = () => {
    setForm(initialForm)
    setError('')
    setSuccessMessage('')
    setShowConfirmation(false)
    navigate(getStudentSectionPath('profile'))
  }

  const handleSaveClick = (event) => {
    event.preventDefault()

    if (!validateAcademicSetupForm(form)) {
      setError(
        'Please complete all required academic setup fields.',
      )
      return
    }

    if (!hasChanges) {
      navigate(getStudentSectionPath('profile'))
      return
    }

    setShowConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (
      !validateAcademicSetupForm(form) ||
      isSaving
    ) {
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = formDataToPayload(form)

      // Never allow the student academic editor to modify PRN.
      if (Object.prototype.hasOwnProperty.call(payload, 'prn')) {
        delete payload.prn
      }

      console.log(
        'Academic setup update payload:',
        payload,
      )

      const result = await updateAcademicSetup(
        profile.id,
        payload,
      )

      console.log(
        'Academic setup update result:',
        result,
      )

      await refreshProfile()

      setShowConfirmation(false)

      setSuccessMessage(
        'Your academic configuration has been updated successfully.',
      )

      window.setTimeout(() => {
        navigate(getStudentSectionPath('profile'))
      }, 1000)
    } catch (saveError) {
      console.error(
        'ACADEMIC SETUP SAVE ERROR:',
        saveError,
      )

      const message =
        saveError?.message ||
        saveError?.details ||
        saveError?.hint ||
        'Unknown error while saving academic setup.'

      setError(
        `Unable to save your academic setup: ${message}`,
      )

      setShowConfirmation(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitPRNRequest = async (event) => {
    event.preventDefault()

    setPRNRequestError('')
    setPRNRequestMessage('')

    const trimmedPRN = requestedPRN.trim()
    const trimmedReason = prnReason.trim()
    const currentPRN = String(profile?.prn ?? '').trim()

    if (!trimmedPRN) {
      setPRNRequestError(
        'Please enter the PRN you want to request.',
      )
      return
    }

    if (!trimmedReason) {
      setPRNRequestError(
        'Please provide a reason for the PRN change.',
      )
      return
    }

    if (
      currentPRN &&
      trimmedPRN.toLowerCase() ===
        currentPRN.toLowerCase()
    ) {
      setPRNRequestError(
        'The requested PRN is the same as your current PRN.',
      )
      return
    }

    if (pendingPRNRequest) {
      setPRNRequestError(
        'You already have a pending PRN change request.',
      )
      return
    }

    setIsSubmittingPRNRequest(true)

    try {
      const request = await createPRNChangeRequest({
        studentId: profile.id,
        currentPRN,
        requestedPRN: trimmedPRN,
        reason: trimmedReason,
      })

      setPendingPRNRequest(request)
      setRequestedPRN('')
      setPRNReason('')

      setPRNRequestMessage(
        'Your PRN change request has been submitted to the admin.',
      )
    } catch (requestError) {
      console.error(
        'PRN REQUEST ERROR:',
        requestError,
      )

      setPRNRequestError(
        requestError?.message ||
          requestError?.details ||
          'Unable to submit the PRN change request.',
      )
    } finally {
      setIsSubmittingPRNRequest(false)
    }
  }

  const currentPRN = String(
    profile?.prn ?? '',
  ).trim()

  return (
    <>
      <section
        className="academic-setup-editor suc-card"
        aria-labelledby="academic-setup-editor-title"
      >
        <header className="academic-setup-editor__header">
          <h2
            id="academic-setup-editor-title"
            className="academic-setup-editor__title"
          >
            Edit Academic Setup
          </h2>

          <p className="academic-setup-editor__subtitle">
            Update your academic selections. These will be
            used to determine your timetable.
          </p>
        </header>

        <section
          className="suc-card"
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3
              style={{
                margin: 0,
                marginBottom: '0.4rem',
              }}
            >
              PRN
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Your PRN cannot be edited directly. A PRN
              change must be requested and approved by an
              administrator.
            </p>
          </div>

          <div className="suc-field">
            <label
              className="suc-label"
              htmlFor="current-prn"
            >
              Current PRN
            </label>

            <input
              id="current-prn"
              className="suc-input"
              type="text"
              value={currentPRN || 'Not set'}
              readOnly
              disabled
            />
          </div>

          {pendingPRNRequest ? (
            <div
              className="suc-alert"
              style={{ marginTop: '1rem' }}
              role="status"
            >
              <strong>
                PRN change request pending.
              </strong>

              <div style={{ marginTop: '0.5rem' }}>
                Requested PRN:{' '}
                <strong>
                  {pendingPRNRequest.requested_prn}
                </strong>
              </div>

              <div style={{ marginTop: '0.25rem' }}>
                The admin must approve this request before
                your PRN can be changed.
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitPRNRequest}
              style={{ marginTop: '1rem' }}
              noValidate
            >
              <div className="suc-field">
                <label
                  className="suc-label suc-label--required"
                  htmlFor="requested-prn"
                >
                  Requested PRN
                </label>

                <input
                  id="requested-prn"
                  className="suc-input"
                  type="text"
                  value={requestedPRN}
                  onChange={(event) =>
                    setRequestedPRN(
                      event.target.value,
                    )
                  }
                  disabled={
                    isSubmittingPRNRequest ||
                    isSaving
                  }
                  placeholder="Enter the new PRN"
                />
              </div>

              <div
                className="suc-field"
                style={{ marginTop: '1rem' }}
              >
                <label
                  className="suc-label suc-label--required"
                  htmlFor="prn-change-reason"
                >
                  Reason for change
                </label>

                <textarea
                  id="prn-change-reason"
                  className="suc-input"
                  value={prnReason}
                  onChange={(event) =>
                    setPRNReason(
                      event.target.value,
                    )
                  }
                  disabled={
                    isSubmittingPRNRequest ||
                    isSaving
                  }
                  placeholder="Explain why your PRN needs to be changed"
                  rows={4}
                  style={{
                    resize: 'vertical',
                  }}
                />
              </div>

              {prnRequestError && (
                <p
                  className="suc-alert suc-alert--error"
                  role="alert"
                  style={{ marginTop: '1rem' }}
                >
                  {prnRequestError}
                </p>
              )}

              {prnRequestMessage && (
                <p
                  className="suc-alert suc-alert--success"
                  role="status"
                  style={{ marginTop: '1rem' }}
                >
                  {prnRequestMessage}
                </p>
              )}

              <button
                type="submit"
                className="suc-btn suc-btn--secondary"
                disabled={
                  isSubmittingPRNRequest ||
                  isSaving
                }
                style={{ marginTop: '1rem' }}
              >
                {isSubmittingPRNRequest
                  ? 'Submitting…'
                  : 'Request PRN Change'}
              </button>
            </form>
          )}
        </section>

        <form
          className="academic-setup-editor__form"
          onSubmit={handleSaveClick}
          noValidate
        >
          <AcademicSetupFields
            form={form}
            onChange={updateField}
            disabled={isSaving}
            idPrefix="edit-"
          />

          {error && (
            <p
              className="academic-setup-editor__message suc-alert suc-alert--error"
              role="alert"
            >
              {error}
            </p>
          )}

          {successMessage && (
            <p
              className="academic-setup-editor__message suc-alert suc-alert--success"
              role="status"
            >
              {successMessage}
            </p>
          )}

          <div className="academic-setup-editor__actions">
            <button
              type="button"
              className="suc-btn suc-btn--secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="suc-btn suc-btn--primary"
              disabled={isSaving || !hasChanges}
              aria-busy={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="suc-spinner"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </section>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm academic changes"
        message="Your academic configuration affects your timetable. Are you sure you want to save these changes?"
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={() =>
          setShowConfirmation(false)
        }
        isLoading={isSaving}
      />
    </>
  )
}

export default AcademicSetupEditor