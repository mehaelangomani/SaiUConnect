import { useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../../auth/AuthContext'
import { saveAcademicSetup } from '../../../lib/profileService'

import {
  ACADEMIC_YEAR_OPTIONS,
  formatElectivesDisplay,
  getOptionLabel,
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  SECTION_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'

import { AcademicCourseFields } from './AcademicCourseFields'
import {
  formDataToPayload,
  profileToFormData,
} from './academicSetupUtils'

import SearchableSelect from './SearchableSelect'

import './AcademicSetupForm.css'

const STEPS = [
  {
    id: 'academic',
    title: 'Academic term',
    description: 'Select your current year.',
  },
  {
    id: 'courses',
    title: 'Course selections',
    description:
      'Choose your minor, electives, section, and lab group.',
  },
  {
    id: 'review',
    title: 'Review & confirm',
    description:
      'Verify your selections before saving.',
  },
]

function createInitialSetupState(profile) {
  return {
    stepIndex: 0,
    form: profileToFormData(profile),
  }
}

function setupReducer(state, action) {
  switch (action.type) {
    case 'update-field':
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
      }

    case 'next-step':
      return {
        ...state,
        stepIndex: Math.min(
          state.stepIndex + 1,
          STEPS.length - 1,
        ),
      }

    case 'previous-step':
      return {
        ...state,
        stepIndex: Math.max(state.stepIndex - 1, 0),
      }

    case 'step':
      return {
        ...state,
        stepIndex: Math.max(
          0,
          Math.min(
            action.stepIndex,
            STEPS.length - 1,
          ),
        ),
      }

    default:
      return state
  }
}

function AcademicSetupForm() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  const [setupState, dispatch] = useReducer(
    setupReducer,
    profile,
    createInitialSetupState,
  )

  const { stepIndex, form } = setupState

  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const currentStep = STEPS[stepIndex]

  const derivedInfo = useMemo(
    () => ({
      /*
       * Always display the university email in lowercase.
       * Login already normalizes the email before authentication,
       * so this keeps the first-time setup display consistent.
       */
      email:
        profile?.email?.trim().toLowerCase() ?? '—',

      school:
        profile?.school ??
        'Will be derived from university email',

      graduationYear:
        profile?.graduation_year ??
        'Will be derived from university email',
    }),
    [profile],
  )

  const updateField = (field, value) => {
    dispatch({
      type: 'update-field',
      field,
      value,
    })

    setError('')
  }

  const validateStep = (index) => {
    if (index === 0) {
      if (
        !String(form.prn ?? '').trim() ||
        !form.academicYear
      ) {
        setError(
          'Please enter your PRN and select an academic year.',
        )

        return false
      }
    }

    if (index === 1) {
      if (
        !form.minor ||
        !form.section ||
        !form.labGroup
      ) {
        setError(
          'Please complete all required course selection fields.',
        )

        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateStep(stepIndex)) {
      return
    }

    dispatch({
      type: 'next-step',
    })
  }

  const handleBack = () => {
    setError('')

    dispatch({
      type: 'previous-step',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateStep(1)) {
      dispatch({
        type: 'step',
        stepIndex: 1,
      })

      return
    }

    setIsSaving(true)
    setError('')

    try {
      await saveAcademicSetup(
        profile.id,
        formDataToPayload(form),
      )

      await refreshProfile()

      setIsSuccess(true)

      window.setTimeout(() => {
        navigate('/student', {
          replace: true,
        })
      }, 1200)
    } catch {
      setError(
        'Unable to save your academic setup. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="academic-setup-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Progress */}
      <div
        className="academic-setup-form__progress"
        aria-label="Setup progress"
      >
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`academic-setup-form__step ${
              index === stepIndex
                ? 'academic-setup-form__step--active'
                : ''
            } ${
              index < stepIndex
                ? 'academic-setup-form__step--complete'
                : ''
            }`}
          >
            <span className="academic-setup-form__step-number">
              {index + 1}
            </span>

            <span className="academic-setup-form__step-label">
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Account details */}
      <section className="academic-setup-form__derived suc-card suc-card--flat">
        <h2 className="academic-setup-form__derived-title">
          Your account details
        </h2>

        <p className="academic-setup-form__derived-note">
          Your university account information is shown below.
        </p>

        <dl className="academic-setup-form__derived-grid">
          <div>
            <dt>Email</dt>
            <dd>{derivedInfo.email}</dd>
          </div>

          <div>
            <dt>School</dt>
            <dd>{derivedInfo.school}</dd>
          </div>

          <div>
            <dt>Graduation year</dt>
            <dd>{derivedInfo.graduationYear}</dd>
          </div>

          <div>
            <dt>Role</dt>

            <dd>
              {profile?.role}

              <span className="suc-badge suc-badge--default">
                Read only
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Current setup step */}
      <section className="academic-setup-form__panel suc-card">
        <header className="academic-setup-form__panel-header">
          <h2 className="academic-setup-form__panel-title">
            {currentStep.title}
          </h2>

          <p className="academic-setup-form__panel-description">
            {currentStep.description}
          </p>
        </header>

        {/* Step 1 */}
        {stepIndex === 0 && (
          <div className="academic-setup-form__fields">
            <TextField
              id="prn"
              label="PRN"
              value={form.prn}
              onChange={(value) =>
                updateField('prn', value)
              }
              disabled={isSaving}
              required
              placeholder="Enter your PRN"
            />

            <SearchableSelect
              id="academicYear"
              label="Academic year"
              value={form.academicYear}
              options={ACADEMIC_YEAR_OPTIONS}
              onChange={(value) =>
                updateField('academicYear', value)
              }
              disabled={isSaving}
              required
              placeholder="Search academic year..."
            />
          </div>
        )}

        {/* Step 2 */}
        {stepIndex === 1 && (
          <div className="academic-setup-form__fields">
            <AcademicCourseFields
              form={form}
              onChange={updateField}
              disabled={isSaving}
              idPrefix="setup-"
            />
          </div>
        )}

        {/* Step 3 */}
        {stepIndex === 2 && (
          <ReviewSummary form={form} />
        )}

        {/* Error */}
        {error && (
          <p
            className="academic-setup-form__error suc-alert suc-alert--error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Success */}
        {isSuccess && (
          <p
            className="academic-setup-form__success suc-alert suc-alert--success"
            role="status"
          >
            Academic setup saved successfully.
            Redirecting to your dashboard…
          </p>
        )}

        {/* Actions */}
        <div className="academic-setup-form__actions">
          {stepIndex > 0 && (
            <button
              type="button"
              className="suc-btn suc-btn--secondary"
              onClick={handleBack}
              disabled={isSaving || isSuccess}
            >
              Back
            </button>
          )}

          {stepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              className="suc-btn suc-btn--primary"
              onClick={handleNext}
              disabled={isSaving || isSuccess}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className="suc-btn suc-btn--primary"
              disabled={isSaving || isSuccess}
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
                'Complete setup'
              )}
            </button>
          )}
        </div>
      </section>
    </form>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  placeholder,
}) {
  return (
    <div className="suc-field">
      <label
        className={`suc-label ${
          required ? 'suc-label--required' : ''
        }`}
        htmlFor={id}
      >
        {label}
      </label>

      <input
        id={id}
        className="suc-input"
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        required={required}
        placeholder={placeholder}
      />
    </div>
  )
}

function ReviewSummary({ form }) {
  const rows = [
    {
      label: 'Academic year',
      value: getOptionLabel(
        ACADEMIC_YEAR_OPTIONS,
        form.academicYear,
      ),
    },
    {
      label: 'Minor',
      value: getOptionLabel(
        MINOR_OPTIONS,
        form.minor,
      ),
    },
    {
      label: 'Electives',
      value: formatElectivesDisplay(
        form.electives,
      ),
    },
    {
      label: 'Section',
      value: getOptionLabel(
        SECTION_OPTIONS,
        form.section,
      ),
    },
    {
      label: 'Lab group',
      value: getOptionLabel(
        LAB_GROUP_OPTIONS,
        form.labGroup,
      ),
    },
  ]

  return (
    <dl className="academic-setup-form__review">
      {rows.map((row) => (
        <div
          key={row.label}
          className="academic-setup-form__review-row"
        >
          <dt>{row.label}</dt>

          <dd>{row.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default AcademicSetupForm