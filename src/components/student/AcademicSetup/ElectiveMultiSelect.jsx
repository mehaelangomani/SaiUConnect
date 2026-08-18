import {
  formatElectivesDisplay,
  getElectiveLabel,
  getElectiveOptionsForSelection,
} from '../../../data/mockAcademicSetupOptions'
import { removeElective, toggleElectiveSelection } from './academicSetupUtils'
import './ElectiveMultiSelect.css'

function ElectiveMultiSelect({ id, label, electives, onChange, disabled = false }) {
  const isNoneSelected = electives.length === 0
  const selectableOptions = getElectiveOptionsForSelection()

  const handleToggleNone = () => {
    onChange([])
  }

  const handleToggleElective = (value) => {
    const nextElectives = toggleElectiveSelection(electives, value)
    onChange(nextElectives)
  }

  const handleRemoveElective = (value) => {
    onChange(removeElective(electives, value))
  }

  return (
    <div className="suc-field elective-multi-select">
      <span className="suc-label" id={`${id}-label`}>
        {label}
      </span>
      <p className="elective-multi-select__hint">
        Select none, one, or multiple electives. &quot;None&quot; clears all elective selections.
      </p>

      <div className="elective-multi-select__none">
        <label className="elective-multi-select__option">
          <input
            type="checkbox"
            checked={isNoneSelected}
            onChange={handleToggleNone}
            disabled={disabled}
          />
          <span>None</span>
        </label>
      </div>

      <div
        className="elective-multi-select__options"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {selectableOptions.map((option) => (
          <label key={option.value} className="elective-multi-select__option">
            <input
              type="checkbox"
              checked={electives.includes(option.value)}
              onChange={() => handleToggleElective(option.value)}
              disabled={disabled}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className="elective-multi-select__selected" aria-live="polite">
        <span className="elective-multi-select__selected-label">Selected electives:</span>
        {isNoneSelected ? (
          <span className="elective-multi-select__selected-empty">None</span>
        ) : (
          <ul className="elective-multi-select__chips">
            {electives.map((value) => (
              <li key={value} className="elective-multi-select__chip">
                <span>{getElectiveLabel(value)}</span>
                <button
                  type="button"
                  className="elective-multi-select__chip-remove"
                  onClick={() => handleRemoveElective(value)}
                  disabled={disabled}
                  aria-label={`Remove ${getElectiveLabel(value)}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="elective-multi-select__summary">
        Timetable preview: {formatElectivesDisplay(electives)}
      </p>
    </div>
  )
}

export default ElectiveMultiSelect
