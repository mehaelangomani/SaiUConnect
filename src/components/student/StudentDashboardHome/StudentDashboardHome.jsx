import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { getStudentEnrolledCourses } from '../../../lib/courseService'
import TodaysSchedule from '../TodaysSchedule/TodaysSchedule'
import NextClass from '../NextClass/NextClass'
import AcademicSummary from '../AcademicSummary/AcademicSummary'

function StudentDashboardHome() {
  const { profile } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [enrolledLoading, setEnrolledLoading] = useState(true)
  const [enrolledError, setEnrolledError] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function loadEnrolledCourses() {
      if (!profile) {
        setEnrolledCourses([])
        setEnrolledError(null)
        setEnrolledLoading(false)
        return
      }

      setEnrolledLoading(true)
      setEnrolledError(null)

      try {
        const data = await getStudentEnrolledCourses(profile)

        if (!isCancelled) {
          setEnrolledCourses(data.courses)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setEnrolledCourses([])
          setEnrolledError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setEnrolledLoading(false)
        }
      }
    }

    loadEnrolledCourses()

    return () => {
      isCancelled = true
    }
  }, [profile])

  return (
    <>
      <TodaysSchedule />
      <NextClass />
      <AcademicSummary
        courses={enrolledCourses}
        isLoading={enrolledLoading}
        error={enrolledError}
      />
    </>
  )
}

export default StudentDashboardHome
