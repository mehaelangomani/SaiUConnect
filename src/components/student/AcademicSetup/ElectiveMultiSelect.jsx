import { useEffect, useRef, useState } from 'react'
import {
  formatElectivesDisplay,
  getElectiveLabel,
  getElectiveOptionsForSelection,
} from '../../../data/mockAcademicSetupOptions'
import {
  removeElective,
  toggleElectiveSelection,
} from './academicSetupUtils'
import './ElectiveMultiSelect.css'

function ElectiveMultiSelect({
  id,
  label,
  electives,
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selectableOptions =
    getElectiveOptionsForSelection()

  const normalizedSearch =
    search.trim().toLowerCase()

  const filteredOptions =
    selectableOptions.filter((option) =>
      option.label
        .toLowerCase()
        .includes(normalizedSearch),
    )

  const isNoneSelected = electives.length === 0

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !containerRef.current?.contains(
          event.target,
        )
      ) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  const openDropdown = () => {
    if (disabled) {
      return
    }

    setIsOpen(true)

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleToggleElective = (value) => {
    const nextElectives =
      toggleElectiveSelection(
        electives,
        value,
      )

    onChange(nextElectives)
  }

  const handleToggleNone = () => {
    onChange([])
  }

  const handleRemoveElective = (value) => {
    onChange(
      removeElective(
        electives,
        value,
      ),
    )
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setSearch('')
    }

    if (
      event.key === 'Enter' &&
      filteredOptions.length > 0
    ) {
      event.preventDefault()

      handleToggleElective(
        filteredOptions[0].value,
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className="suc-field elective-multi-select"
    >
      <label
        className="suc-label"
        id={`${id}-label`}
      >
        {label}
      </label>

      <p className="elective-multi-select__hint">
        Search and select one or multiple electives.
      </p>

      {/* Search / trigger */}
      <div className="elective-multi-select__container">
        <div
          className={`elective-multi-select__control ${
            isOpen
              ? 'elective-multi-select__control--open'
              : ''
          }`}
          onClick={openDropdown}
        >
          <span
            className="elective-multi-select__search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            ref={inputRef}
            id={`${id}-search`}
            type="text"
            className="elective-multi-select__input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search electives..."
            autoComplete="off"
            disabled={disabled}
            aria-expanded={isOpen}
            aria-controls={`${id}-options`}
          />

          <button
            type="button"
            className="elective-multi-select__arrow"
            onClick={(event) => {
              event.stopPropagation()

              if (isOpen) {
                setIsOpen(false)
                setSearch('')
              } else {
                openDropdown()
              }
            }}
            disabled={disabled}
            aria-label="Open elective options"
          >
            ▼
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            id={`${id}-options`}
            className="elective-multi-select__dropdown"
            role="group"
            aria-labelledby={`${id}-label`}
          >
            <button
              type="button"
              className={`elective-multi-select__option ${
                isNoneSelected
                  ? 'elective-multi-select__option--selected'
                  : ''
              }`}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={handleToggleNone}
            >
              <span className="elective-multi-select__option-left">
                <span
                  className={`elective-multi-select__checkbox ${
                    isNoneSelected
                      ? 'elective-multi-select__checkbox--checked'
                      : ''
                  }`}
                >
                  {isNoneSelected ? '✓' : ''}
                </span>

                <span>None</span>
              </span>

              {isNoneSelected && (
                <span className="elective-multi-select__check">
                  ✓
                </span>
              )}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected =
                  electives.includes(
                    option.value,
                  )

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`elective-multi-select__option ${
                      isSelected
                        ? 'elective-multi-select__option--selected'
                        : ''
                    }`}
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
                    onClick={() =>
                      handleToggleElective(
                        option.value,
                      )
                    }
                  >
                    <span className="elective-multi-select__option-left">
                      <span
                        className={`elective-multi-select__checkbox ${
                          isSelected
                            ? 'elective-multi-select__checkbox--checked'
                            : ''
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </span>

                      <span>
                        {option.label}
                      </span>
                    </span>

                    {isSelected && (
                      <span className="elective-multi-select__check">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="elective-multi-select__empty">
                No matching electives found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected electives */}
      <div
        className="elective-multi-select__selected"
        aria-live="polite"
      >
        <span className="elective-multi-select__selected-label">
          Selected electives
        </span>

        {isNoneSelected ? (
          <span className="elective-multi-select__selected-empty">
            None selected
          </span>
        ) : (
          <div className="elective-multi-select__chips">
            {electives.map((value) => (
              <span
                key={value}
                className="elective-multi-select__chip"
              >
                <span>
                  {getElectiveLabel(value)}
                </span>

                <button
                  type="button"
                  className="elective-multi-select__chip-remove"
                  onClick={() =>
                    handleRemoveElective(value)
                  }
                  disabled={disabled}
                  aria-label={`Remove ${getElectiveLabel(
                    value,
                  )}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="elective-multi-select__summary">
        Timetable preview:{' '}
        {formatElectivesDisplay(electives)}
      </p>
    </div>
  )
}

export default ElectiveMultiSelect