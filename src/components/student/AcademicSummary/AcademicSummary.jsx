import { useAuth } from '../../../auth/AuthContext'
import {
  ACADEMIC_YEAR_OPTIONS,
  getOptionLabel,
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  NONE_OPTION_VALUE,
  SECTION_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import './AcademicSummary.css'

function SummaryRow({ label, value }) {
  return (
    <div className="academic-summary__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function AcademicSummary({ courses, isLoading, error }) {
  const { profile } = useAuth()

  const electiveCount = Array.isArray(profile?.electives)
    ? profile.electives.filter((value) => value && value !== NONE_OPTION_VALUE).length
    : 0

  const minorDisplay = profile?.minor && profile.minor !== NONE_OPTION_VALUE
    ? getOptionLabel(MINOR_OPTIONS, profile.minor)
    : 'None'

  const sectionDisplay = getOptionLabel(SECTION_OPTIONS, profile?.section)
  const labDisplay = getOptionLabel(LAB_GROUP_OPTIONS, profile?.lab_group)
  const yearDisplay = getOptionLabel(ACADEMIC_YEAR_OPTIONS, profile?.academic_year)

  const enrolledCount = isLoading ? '…' : String(courses?.length ?? 0)

  return (
    <section className="academic-summary suc-card" aria-labelledby="academic-summary-title">
      <h2 id="academic-summary-title" className="academic-summary__title">
        Academic Summary
      </h2>

      {error && (
        <p className="academic-summary__notice" role="status">
          Enrolled course count is temporarily unavailable.
        </p>
      )}

      <dl className="academic-summary__list">
        <SummaryRow label="Enrolled courses" value={enrolledCount} />
        <SummaryRow label="Electives" value={String(electiveCount)} />
        <SummaryRow label="Minor" value={minorDisplay} />
        <SummaryRow
          label="Section"
          value={sectionDisplay !== 'None' ? sectionDisplay : '—'}
        />
        <SummaryRow
          label="Lab group"
          value={labDisplay !== 'None' ? labDisplay : '—'}
        />
        <SummaryRow
          label="Academic year"
          value={yearDisplay !== 'None' ? yearDisplay : '—'}
        />
      </dl>
    </section>
  )
}

export default AcademicSummary
