import { useEffect, useRef } from 'react'
import './FacultySearch.css'

function FacultySearch({
  query,
  onQueryChange,
  suggestions,
  isOpen,
  onClose,
  onOpen,
  onSelect,
  disabled = false,
}) {
  const wrapRef = useRef(null)
  const showDropdown = isOpen && query.trim().length > 0

  useEffect(() => {
    if (!showDropdown) {
      return undefined
    }

    function handlePointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showDropdown, onClose])

  return (
    <div className="faculty-search" ref={wrapRef}>
      <label className="suc-label faculty-search__label" htmlFor="faculty-portal-search">
        Search faculty
      </label>
      <div className="faculty-search__anchor">
        <input
          id="faculty-portal-search"
          className="faculty-search__input suc-input"
          type="search"
          placeholder="Search faculty..."
          value={query}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="faculty-portal-suggestions"
          aria-autocomplete="list"
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => {
            if (query.trim()) {
              onOpen?.()
            }
          }}
        />

        {showDropdown && (
          <div id="faculty-portal-suggestions" className="faculty-search__dropdown suc-card" role="listbox">
            {suggestions.length === 0 ? (
              <p className="faculty-search__empty" role="status">
                No faculty found.
              </p>
            ) : (
              <ul className="faculty-search__list">
                {suggestions.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      className="faculty-search__option"
                      role="option"
                      onClick={() => onSelect(member)}
                    >
                      <span className="faculty-search__option-name">{member.name}</span>
                      {member.email && (
                        <span className="faculty-search__option-meta">{member.email}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FacultySearch
