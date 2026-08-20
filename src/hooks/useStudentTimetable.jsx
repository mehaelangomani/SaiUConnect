import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getStudentTimetable } from '../lib/timetableService'

const StudentTimetableContext = createContext(null)

function buildProfileKey(profile) {
  if (!profile) {
    return null
  }

  return [
    profile.school,
    profile.academic_year,
    profile.semester,
    profile.section,
    profile.lab_group,
    profile.minor,
    (profile.electives ?? []).join(','),
  ].join('|')
}

function useStudentTimetableState() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [termNotFound, setTermNotFound] = useState(false)

  const profileKey = useMemo(() => buildProfileKey(profile), [profile])

  useEffect(() => {
    let isCancelled = false

    async function loadTimetable() {
      if (!profile) {
        setEntries([])
        setError(null)
        setTermNotFound(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const timetable = await getStudentTimetable(profile)

        if (!isCancelled) {
          setEntries(timetable.entries)
          setTermNotFound(Boolean(timetable.termNotFound))
        }
      } catch (loadError) {
        if (!isCancelled) {
          setEntries([])
          setTermNotFound(false)
          setError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTimetable()

    return () => {
      isCancelled = true
    }
  }, [profile, profileKey])

  return {
    entries,
    isLoading,
    error,
    termNotFound,
  }
}

export function StudentTimetableProvider({ children }) {
  const value = useStudentTimetableState()

  return (
    <StudentTimetableContext.Provider value={value}>
      {children}
    </StudentTimetableContext.Provider>
  )
}

export function useStudentTimetable() {
  const context = useContext(StudentTimetableContext)

  if (!context) {
    throw new Error('useStudentTimetable must be used within StudentTimetableProvider')
  }

  return context
}
