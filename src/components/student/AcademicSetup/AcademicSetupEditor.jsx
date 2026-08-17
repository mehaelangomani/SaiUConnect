import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { updateAcademicSetup } from '../../../lib/profileService'
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
  const initialForm = useMemo(() => profileToFormData(profile), [profile])

  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const hasChanges = hasAcademicSetupChanges(initialForm, form)

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
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
      setError('Please complete all required academic setup fields.')
      return
    }

    if (!hasChanges) {
      navigate(getStudentSectionPath('profile'))
      return
    }

    setShowConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!validateAcademicSetupForm(form) || isSaving) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await updateAcademicSetup(profile.id, formDataToPayload(form))
      await refreshProfile()
      setShowConfirmation(false)
      setSuccessMessage('Your academic configuration has been updated successfully.')

      window.setTimeout(() => {
        navigate(getStudentSectionPath('profile'))
      }, 1000)
    } catch {
      setError('Unable to save your changes. Please try again.')
      setShowConfirmation(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className="academic-setup-editor suc-card" aria-labelledby="academic-setup-editor-title">
        <header className="academic-setup-editor__header">
          <h2 id="academic-setup-editor-title" className="academic-setup-editor__title">
            Edit Academic Setup
          </h2>
          <p className="academic-setup-editor__subtitle">
            Update your academic selections. These will be used to determine your timetable in a future
            release.
          </p>
        </header>

        <form className="academic-setup-editor__form" onSubmit={handleSaveClick} noValidate>
          <AcademicSetupFields
            form={form}
            onChange={updateField}
            disabled={isSaving}
            idPrefix="edit-"
          />

          {error && (
            <p className="academic-setup-editor__message suc-alert suc-alert--error" role="alert">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="academic-setup-editor__message suc-alert suc-alert--success" role="status">
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
                  <span className="suc-spinner" aria-hidden="true" />
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
        onCancel={() => setShowConfirmation(false)}
        isLoading={isSaving}
      />
    </>
  )
}

export default AcademicSetupEditor
