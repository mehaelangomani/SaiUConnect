import {
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  SECTION_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import ElectiveMultiSelect from './ElectiveMultiSelect'

export function AcademicCourseFields({ form, onChange, disabled = false, idPrefix = '' }) {
  return (
    <>
      <AcademicSelectField
        id={`${idPrefix}minor`}
        label="Minor"
        value={form.minor}
        options={MINOR_OPTIONS}
        onChange={(value) => onChange('minor', value)}
        disabled={disabled}
        required
      />
      <div className="academic-setup-form__field-full">
        <ElectiveMultiSelect
          id={`${idPrefix}electives`}
          label="Electives"
          electives={form.electives}
          onChange={(value) => onChange('electives', value)}
          disabled={disabled}
        />
      </div>
      <AcademicSelectField
        id={`${idPrefix}section`}
        label="Section"
        value={form.section}
        options={SECTION_OPTIONS}
        onChange={(value) => onChange('section', value)}
        disabled={disabled}
        required
      />
      <AcademicSelectField
        id={`${idPrefix}labGroup`}
        label="Lab group"
        value={form.labGroup}
        options={LAB_GROUP_OPTIONS}
        onChange={(value) => onChange('labGroup', value)}
        disabled={disabled}
        required
      />
    </>
  )
}

function AcademicSelectField({ id, label, value, options, onChange, disabled, required }) {
  return (
    <div className="suc-field">
      <label className={`suc-label ${required ? 'suc-label--required' : ''}`} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="suc-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
