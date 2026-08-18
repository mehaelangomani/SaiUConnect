import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  getFacultyCourses,
  getFacultyDetails,
  getFacultyDirectory,
  getFacultyWeeklyAvailability,
  searchFacultyByKeyword,
} from '../../../lib/facultyService'
import FacultyAvailabilityGrid from './FacultyAvailabilityGrid'
import './FacultyDirectory.css'

const SEARCH_DEBOUNCE_MS = 250

function ErrorState({ message }) {
  return (
    <div className="suc-alert suc-alert--error faculty-directory__alert" role="alert">
      <div>
        <p className="suc-alert__title">Could not load faculty directory</p>
        <p>{message}</p>
      </div>
    </div>
  )
}

function FacultyDetailsModal({ member, courses, profile, onClose }) {
  const [availability, setAvailability] = useState(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilityError, setAvailabilityError] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function loadAvailability() {
      setAvailabilityLoading(true)
      setAvailabilityError(null)
      setAvailability(null)

      try {
        const data = await getFacultyWeeklyAvailability({
          facultyId: member.id,
          profile,
        })

        if (!isCancelled) {
          setAvailability(data)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setAvailability(null)
          setAvailabilityError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setAvailabilityLoading(false)
        }
      }
    }

    loadAvailability()

    return () => {
      isCancelled = true
    }
  }, [member.id, profile])

  return (
    <>
      <button
        type="button"
        className="faculty-directory__modal-backdrop"
        onClick={onClose}
        aria-label="Close faculty details"
      />
      <div
        className="faculty-directory__modal faculty-directory__modal--wide suc-card"
        role="dialog"
        aria-modal="true"
      >
        <div className="faculty-directory__modal-header">
          <div className="faculty-directory__modal-title-wrap">
            <div className="faculty-directory__avatar faculty-directory__avatar--large">
              {member.initial}
            </div>
            <div>
              <h3 className="faculty-directory__modal-title">{member.name}</h3>
              {member.department && (
                <p className="faculty-directory__modal-subtitle">{member.department}</p>
              )}
            </div>
          </div>
          <button type="button" className="faculty-directory__modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <dl className="faculty-directory__modal-meta">
          <div>
            <dt>Email</dt>
            <dd>{member.email}</dd>
          </div>
          {member.schoolName && (
            <div>
              <dt>School</dt>
              <dd>{member.schoolName}</dd>
            </div>
          )}
        </dl>

        <section className="faculty-directory__courses" aria-label="Courses taught">
          <h4 className="faculty-directory__courses-title">Courses taught</h4>
          {courses.length === 0 ? (
            <p className="faculty-directory__courses-empty">
              No published courses found for your current academic term.
            </p>
          ) : (
            <ul className="faculty-directory__courses-list">
              {courses.map((course) => (
                <li key={course.id} className="faculty-directory__course-item">
                  <span className="faculty-directory__course-code">{course.code}</span>
                  <span className="faculty-directory__course-name">{course.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="faculty-directory__availability" aria-label="Faculty availability">
          <h4 className="faculty-directory__availability-title">Faculty Availability</h4>
          <p className="faculty-directory__availability-subtitle">Free Time</p>
          <FacultyAvailabilityGrid
            availability={availability}
            isLoading={availabilityLoading}
            error={availabilityError}
          />
        </section>
      </div>
    </>
  )
}

function FacultyDirectory() {
  const { profile } = useAuth()
  const searchRef = useRef(null)
  const [directory, setDirectory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedFacultyId, setSelectedFacultyId] = useState(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    let isCancelled = false

    async function loadDirectory() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getFacultyDirectory(profile)

        if (!isCancelled) {
          setDirectory(data)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setDirectory(null)
          setError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDirectory()

    return () => {
      isCancelled = true
    }
  }, [profile])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const trimmedQuery = searchQuery.trim()
  const hasQuery = trimmedQuery.length > 0
  const isSearching = hasQuery && searchQuery.trim() !== debouncedQuery.trim()

  const suggestions = useMemo(() => {
    if (!directory || !hasQuery) {
      return []
    }

    return searchFacultyByKeyword(trimmedQuery, directory)
  }, [directory, trimmedQuery, hasQuery])

  const showDropdown = isDropdownOpen && hasQuery && !isLoading && !error
  const selectedFaculty = selectedFacultyId && directory
    ? getFacultyDetails(directory.faculty, selectedFacultyId)
    : null
  const selectedFacultyCourses = selectedFaculty && directory
    ? getFacultyCourses(directory.coursesByFacultyId, selectedFaculty.id)
    : []

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchQuery(value)
    setIsDropdownOpen(value.trim().length > 0)
    setSelectedFacultyId(null)
  }

  const handleSelectSuggestion = (member) => {
    setSearchQuery(member.name)
    setDebouncedQuery(member.name)
    setSelectedFacultyId(member.id)
    setIsDropdownOpen(false)
  }

  const handleCloseDetails = () => {
    setSelectedFacultyId(null)
  }

  return (
    <section className="faculty-directory" aria-labelledby="faculty-directory-title">
      <div className="faculty-directory__header">
        <h2 id="faculty-directory-title" className="faculty-directory__title">
          Faculty
        </h2>
        <p className="faculty-directory__subtitle">
          Search for a faculty member
        </p>
      </div>

      {error && (
        <ErrorState message={error.message ?? 'Please try again in a moment.'} />
      )}

      <div className="faculty-directory__search-wrap" ref={searchRef}>
        <label className="suc-label faculty-directory__search-label" htmlFor="faculty-directory-search">
          Faculty search
        </label>
        <div className="faculty-directory__search-anchor">
          <div className="faculty-directory__search-field suc-card">
            <input
              id="faculty-directory-search"
              className="faculty-directory__search-input"
              type="search"
              placeholder="Search faculty by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsDropdownOpen(true)
                }
              }}
              disabled={isLoading || Boolean(error)}
              autoComplete="off"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="faculty-directory-suggestions"
              aria-autocomplete="list"
            />
            {(isLoading || isSearching) && (
              <span className="faculty-directory__search-spinner suc-spinner suc-spinner--dark" aria-hidden="true" />
            )}
          </div>

          {showDropdown && (
            <div
              id="faculty-directory-suggestions"
              className="faculty-directory__dropdown"
              role="listbox"
            >
              {isSearching ? (
                <p className="faculty-directory__dropdown-status" role="status">
                  <span className="faculty-directory__dropdown-spinner suc-spinner suc-spinner--dark" aria-hidden="true" />
                  Searching…
                </p>
              ) : suggestions.length === 0 ? (
                <p className="faculty-directory__dropdown-status" role="status">
                  No faculty members found
                </p>
              ) : (
                <ul className="faculty-directory__suggestions">
                  {suggestions.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        className="faculty-directory__suggestion"
                        role="option"
                        onClick={() => handleSelectSuggestion(member)}
                      >
                        <span className="faculty-directory__avatar">{member.initial}</span>
                        <span className="faculty-directory__suggestion-body">
                          <span className="faculty-directory__suggestion-name">{member.name}</span>
                          {member.department && (
                            <span className="faculty-directory__suggestion-department">
                              {member.department}
                            </span>
                          )}
                          {member.email && (
                            <span className="faculty-directory__suggestion-email">
                              {member.email}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {!isLoading && !error && !hasQuery && !selectedFaculty && (
        <p className="faculty-directory__prompt" role="status">
          Start typing a faculty name
        </p>
      )}

      {selectedFaculty && !isDropdownOpen && (
        <FacultyDetailsModal
          member={selectedFaculty}
          courses={selectedFacultyCourses}
          profile={profile}
          onClose={handleCloseDetails}
        />
      )}
    </section>
  )
}

export default FacultyDirectory
