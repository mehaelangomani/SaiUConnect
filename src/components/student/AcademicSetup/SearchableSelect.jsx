import { useEffect, useRef, useState } from 'react'

import './SearchableSelect.css'

function SearchableSelect({
  id,
  label,
  value,
  options = [],
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Search...',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [openDirection, setOpenDirection] = useState('down')

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selectedOption =
    options.find((option) => option.value === value) ?? null

  const normalizedSearch = search.trim().toLowerCase()

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedSearch),
  )

  const calculateOpenDirection = () => {
    if (!containerRef.current) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    // Approximate dropdown height.
    // The CSS max-height is 280px, so this gives the dropdown
    // enough room to decide whether it should open upward.
    const requiredSpace = Math.min(
      280,
      Math.max(180, filteredOptions.length * 50 + 20),
    )

    if (
      spaceBelow < requiredSpace &&
      spaceAbove > spaceBelow
    ) {
      setOpenDirection('up')
    } else {
      setOpenDirection('down')
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    calculateOpenDirection()

    const handleViewportChange = () => {
      calculateOpenDirection()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener(
        'resize',
        handleViewportChange,
      )

      window.removeEventListener(
        'scroll',
        handleViewportChange,
        true,
      )
    }
  }, [isOpen, filteredOptions.length])

  const openDropdown = () => {
    if (disabled) {
      return
    }

    calculateOpenDirection()
    setIsOpen(true)

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const closeDropdown = () => {
    setIsOpen(false)
    setSearch('')
  }

  const handleSelect = (option) => {
    onChange(option.value)
    closeDropdown()
  }

  const handleClear = (event) => {
    event.stopPropagation()
    onChange('')
    closeDropdown()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      return
    }

    if (
      event.key === 'Enter' &&
      filteredOptions.length > 0
    ) {
      event.preventDefault()
      handleSelect(filteredOptions[0])
    }
  }

  return (
    <div
      ref={containerRef}
      className="suc-field searchable-select"
    >
      <label
        className={`suc-label ${
          required ? 'suc-label--required' : ''
        }`}
        htmlFor={`${id}-search`}
      >
        {label}
      </label>

      <div className="searchable-select__container">
        <div
          className={`searchable-select__control ${
            isOpen
              ? 'searchable-select__control--open'
              : ''
          } ${
            disabled
              ? 'searchable-select__control--disabled'
              : ''
          }`}
          onClick={openDropdown}
        >
          <span
            className="searchable-select__search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            ref={inputRef}
            id={`${id}-search`}
            type="text"
            className={`searchable-select__input ${
              selectedOption && !isOpen
                ? 'searchable-select__input--has-selection'
                : ''
            }`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (!disabled) {
                calculateOpenDirection()
                setIsOpen(true)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isOpen
                ? placeholder
                : selectedOption?.label ?? placeholder
            }
            autoComplete="off"
            disabled={disabled}
            aria-expanded={isOpen}
            aria-controls={`${id}-options`}
            aria-autocomplete="list"
          />

          {selectedOption && !isOpen && (
            <button
              type="button"
              className="searchable-select__clear"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={handleClear}
              disabled={disabled}
              aria-label={`Clear ${label}`}
            >
              ×
            </button>
          )}

          <button
            type="button"
            className="searchable-select__arrow"
            onClick={(event) => {
              event.stopPropagation()

              if (isOpen) {
                closeDropdown()
              } else {
                openDropdown()
              }
            }}
            disabled={disabled}
            aria-label={`Open ${label} options`}
            aria-expanded={isOpen}
          >
            ▼
          </button>
        </div>

        {isOpen && (
          <div
            id={`${id}-options`}
            className={`searchable-select__dropdown searchable-select__dropdown--${openDirection}`}
            role="listbox"
            aria-label={label}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected =
                  option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`searchable-select__option ${
                      isSelected
                        ? 'searchable-select__option--selected'
                        : ''
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault()
                    }}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="searchable-select__option-label">
                      {option.label}
                    </span>

                    {isSelected && (
                      <span
                        className="searchable-select__check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="searchable-select__empty">
                No matching {label.toLowerCase()} found.
              </div>
            )}

            {value && (
              <button
                type="button"
                className="searchable-select__clear-option"
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onClick={handleClear}
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchableSelect