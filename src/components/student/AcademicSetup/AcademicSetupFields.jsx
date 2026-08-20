import {
  ACADEMIC_YEAR_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import { AcademicCourseFields } from './AcademicCourseFields'

export function AcademicSetupFields({ form, onChange, disabled = false, idPrefix = '' }) {
  return (
    <div className="academic-setup-form__fields">
      <AcademicSelectField
        id={`${idPrefix}academicYear`}
        label="Academic year"
        value={form.academicYear}
        options={ACADEMIC_YEAR_OPTIONS}
        onChange={(value) => onChange('academicYear', value)}
        disabled={disabled}
        required
      />
      <AcademicCourseFields
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
    </div>
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
