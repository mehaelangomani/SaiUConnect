import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import PageBackground from '../components/PageBackground/PageBackground'
import SaiUniversityMark from '../components/SaiUniversityMark/SaiUniversityMark'
import FacultyProfileMenu from '../components/faculty/FacultyProfileMenu'
import FacultySearch from '../components/faculty/FacultySearch'
import FacultyTimetable from '../components/faculty/FacultyTimetable'
import { getFacultyDirectory, searchFacultyByKeyword } from '../lib/facultyService'
import { fetchFacultyTimetable, findFacultyByProfileId } from '../lib/facultyTimetableService'
import './FacultyDashboard.css'

function FacultyDashboard() {
  const { profile } = useAuth()
  const [facultyList, setFacultyList] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [entries, setEntries] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true)
  const [isTimetableLoading, setIsTimetableLoading] = useState(false)
  const [directoryError, setDirectoryError] = useState(null)
  const [timetableError, setTimetableError] = useState(null)

  const suggestions = useMemo(
    () => searchFacultyByKeyword(searchQuery, { faculty: facultyList }),
    [searchQuery, facultyList],
  )

  const loadTimetable = useCallback(async (facultyMember) => {
    if (!facultyMember?.id) {
      setEntries([])
      return
    }

    setIsTimetableLoading(true)
    setTimetableError(null)
    try {
      const result = await fetchFacultyTimetable(facultyMember.id)
      setEntries(result.entries)
      if (result.message) {
        setTimetableError(result.message)
      }
    } catch (loadError) {
      setEntries([])
      setTimetableError(loadError.message ?? 'Could not load the timetable. Please try again.')
    } finally {
      setIsTimetableLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDirectory() {
      setIsDirectoryLoading(true)
      setDirectoryError(null)
      try {
        const directory = await getFacultyDirectory()
        if (cancelled) {
          return
        }
        const list = directory.faculty ?? []
        setFacultyList(list)
        const matched = findFacultyByProfileId(list, profile?.id)
        if (matched) {
          setSelectedFaculty(matched)
        } else {
          setSelectedFaculty(null)
        }
      } catch {
        if (!cancelled) {
          setDirectoryError('Could not load faculty directory. Please try again.')
          setSelectedFaculty(null)
        }
      } finally {
        if (!cancelled) {
          setIsDirectoryLoading(false)
        }
      }
    }

    loadDirectory()
    return () => {
      cancelled = true
    }
  }, [profile?.id])

  useEffect(() => {
    if (selectedFaculty?.id) {
      loadTimetable(selectedFaculty)
    } else {
      setEntries([])
    }
  }, [selectedFaculty, loadTimetable])

  const handleQueryChange = (value) => {
    setSearchQuery(value)
    setIsSearchOpen(value.trim().length > 0)
  }

  const handleSelectFaculty = (member) => {
    setSelectedFaculty(member)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  return (
    <PageBackground variant="dashboard" watermarkVariant="corner">
      <div className="faculty-portal">
        <header className="faculty-portal__header">
          <div className="faculty-portal__brand">
            <SaiUniversityMark className="faculty-portal__mark" />
            <div>
              <span className="faculty-portal__brand-name">SaiUConnect</span>
              <span className="faculty-portal__brand-role">Faculty Timetable</span>
            </div>
          </div>
          <FacultyProfileMenu />
        </header>

        <main className="faculty-portal__main">
          <h1 className="faculty-portal__title">Faculty Timetable</h1>

          {directoryError && (
            <div className="suc-alert suc-alert--error faculty-portal__alert" role="alert">
              <p>{directoryError}</p>
            </div>
          )}

          <FacultySearch
            query={searchQuery}
            onQueryChange={handleQueryChange}
            suggestions={suggestions}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onOpen={() => setIsSearchOpen(true)}
            onSelect={handleSelectFaculty}
            disabled={isDirectoryLoading || Boolean(directoryError)}
          />

          {selectedFaculty && (
            <p className="faculty-portal__selected">
              Selected: <strong>{selectedFaculty.name}</strong>
            </p>
          )}

          {selectedFaculty && (
            <section className="faculty-portal__timetable suc-card" aria-label="Faculty timetable">
              <FacultyTimetable
                entries={entries}
                isLoading={isDirectoryLoading || isTimetableLoading}
                error={timetableError}
                emptyMessage="No timetable entries found."
              />
            </section>
          )}
        </main>
      </div>
    </PageBackground>
  )
}

export default FacultyDashboard
