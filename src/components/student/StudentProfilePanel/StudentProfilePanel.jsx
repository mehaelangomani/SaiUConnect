import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import {
  ACADEMIC_YEAR_OPTIONS,
  formatElectivesDisplay,
  getOptionLabel,
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  SECTION_OPTIONS,
  SEMESTER_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import { getStudentSectionPath } from '../studentNav'
import './StudentProfilePanel.css'

function StudentProfilePanel() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  if (!profile) {
    return null
  }

  const fields = [
    { label: 'Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Role', value: profile.role, readOnly: true },
    { label: 'School', value: profile.school },
    { label: 'Graduation year', value: profile.graduation_year },
    { label: 'Initial', value: profile.initial },
    {
      label: 'Academic year',
      value: profile.academic_year
        ? getOptionLabel(ACADEMIC_YEAR_OPTIONS, profile.academic_year)
        : null,
    },
    {
      label: 'Semester',
      value: profile.semester ? getOptionLabel(SEMESTER_OPTIONS, profile.semester) : null,
    },
    {
      label: 'Minor',
      value: getOptionLabel(MINOR_OPTIONS, profile.minor),
    },
    {
      label: 'Electives',
      value: formatElectivesDisplay(profile.electives),
    },
    {
      label: 'Section',
      value: profile.section ? getOptionLabel(SECTION_OPTIONS, profile.section) : null,
    },
    {
      label: 'Lab group',
      value: profile.lab_group ? getOptionLabel(LAB_GROUP_OPTIONS, profile.lab_group) : null,
    },
  ]

  return (
    <section className="student-profile-panel suc-card" aria-labelledby="student-profile-title">
      <div className="student-profile-panel__header">
        <div>
          <h2 id="student-profile-title" className="student-profile-panel__title">
            My Profile
          </h2>
          <p className="student-profile-panel__subtitle">
            Your account information from SaiUConnect. Role is managed by administrators.
          </p>
        </div>
      </div>

      <dl className="student-profile-panel__grid">
        {fields.map((field) => (
          <div key={field.label} className="student-profile-panel__field">
            <dt>{field.label}</dt>
            <dd>
              {field.value ?? '—'}
              {field.readOnly && (
                <span className="student-profile-panel__readonly suc-badge suc-badge--default">
                  Read only
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="student-profile-panel__actions">
        {profile.academic_setup_completed && (
          <button
            type="button"
            className="suc-btn suc-btn--secondary"
            onClick={() => navigate(getStudentSectionPath('academic-setup'))}
          >
            Edit Academic Setup
          </button>
        )}
        <button
          type="button"
          className="suc-btn suc-btn--ghost"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    </section>
  )
}

export default StudentProfilePanel
