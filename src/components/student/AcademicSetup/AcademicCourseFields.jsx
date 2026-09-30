import {
  LAB_GROUP_OPTIONS,
  MINOR_OPTIONS,
  SECTION_OPTIONS,
} from '../../../data/mockAcademicSetupOptions'
import ElectiveMultiSelect from './ElectiveMultiSelect'
import SearchableSelect from './SearchableSelect'

export function AcademicCourseFields({
  form,
  onChange,
  disabled = false,
  idPrefix = '',
}) {
  return (
    <>
      <SearchableSelect
        id={`${idPrefix}minor`}
        label="Minor"
        value={form.minor}
        options={MINOR_OPTIONS}
        onChange={(value) => onChange('minor', value)}
        disabled={disabled}
        required
        placeholder="Search minor..."
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

      <SearchableSelect
        id={`${idPrefix}section`}
        label="Section"
        value={form.section}
        options={SECTION_OPTIONS}
        onChange={(value) => onChange('section', value)}
        disabled={disabled}
        placeholder="Search section..."
      />

      <SearchableSelect
        id={`${idPrefix}labGroup`}
        label="Lab group"
        value={form.labGroup}
        options={LAB_GROUP_OPTIONS}
        onChange={(value) => onChange('labGroup', value)}
        disabled={disabled}
        placeholder="Search lab group..."
      />
    </>
  )
}