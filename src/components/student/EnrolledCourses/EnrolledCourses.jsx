import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  filterEnrolledCourses,
  getStudentEnrolledCourses,
  groupCoursesByCategory,
} from '../../../lib/courseService'
import './EnrolledCourses.css'

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'minor', label: 'Minor' },
  { id: 'elective', label: 'Electives' },
  { id: 'lab', label: 'Labs' },
]

function LoadingState() {
  return (
    <div className="enrolled-courses__status" role="status" aria-live="polite">
      <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
      <p className="enrolled-courses__status-text">Loading your enrolled courses…</p>
      <div className="enrolled-courses__skeleton-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="enrolled-courses__skeleton-card suc-card" />
        ))}
      </div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="suc-alert suc-alert--error enrolled-courses__alert" role="alert">
      <div>
        <p className="suc-alert__title">Could not load enrolled courses</p>
        <p>{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="enrolled-courses__empty-state suc-card" role="status">
      <p>{message}</p>
    </div>
  )
}

function CourseCard({ course, onSelect }) {
  return (
    <button
      type="button"
      className="enrolled-courses__card suc-card"
      onClick={() => onSelect(course)}
    >
      <div className="enrolled-courses__card-header">
        <span className="enrolled-courses__course-code">{course.code}</span>
        <span className="suc-badge suc-badge--default">{course.categoryLabel}</span>
      </div>
      <h3 className="enrolled-courses__course-name">{course.name}</h3>
      <dl className="enrolled-courses__card-meta">
        {course.credits != null && (
          <div>
            <dt>Credits</dt>
            <dd>{course.credits}</dd>
          </div>
        )}
        {course.primaryFaculty && (
          <div>
            <dt>Faculty</dt>
            <dd>{course.primaryFaculty}</dd>
          </div>
        )}
        {course.primaryRoom && (
          <div>
            <dt>Room</dt>
            <dd>{course.primaryRoom}</dd>
          </div>
        )}
        {course.audienceContext && (
          <div>
            <dt>Section</dt>
            <dd>{course.audienceContext}</dd>
          </div>
        )}
      </dl>
    </button>
  )
}

function CourseDetailsModal({ course, onClose }) {
  return (
    <>
      <button
        type="button"
        className="enrolled-courses__modal-backdrop"
        onClick={onClose}
        aria-label="Close course details"
      />
      <div className="enrolled-courses__modal suc-card" role="dialog" aria-modal="true">
        <div className="enrolled-courses__modal-header">
          <div>
            <p className="enrolled-courses__modal-code">{course.code}</p>
            <h3 className="enrolled-courses__modal-title">{course.name}</h3>
          </div>
          <button type="button" className="enrolled-courses__modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <dl className="enrolled-courses__modal-meta">
          <div>
            <dt>Category</dt>
            <dd>{course.categoryLabel}</dd>
          </div>
          {course.credits != null && (
            <div>
              <dt>Credits</dt>
              <dd>{course.credits}</dd>
            </div>
          )}
          {course.audienceContext && (
            <div>
              <dt>Section / Lab</dt>
              <dd>{course.audienceContext}</dd>
            </div>
          )}
        </dl>

        {course.facultyNames.length > 0 && (
          <section className="enrolled-courses__modal-section" aria-label="Faculty">
            <h4 className="enrolled-courses__modal-section-title">Faculty</h4>
            <ul className="enrolled-courses__modal-list">
              {course.facultyNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        )}

        {course.rooms.length > 0 && (
          <section className="enrolled-courses__modal-section" aria-label="Rooms">
            <h4 className="enrolled-courses__modal-section-title">Rooms</h4>
            <ul className="enrolled-courses__modal-list">
              {course.rooms.map((room) => (
                <li key={room}>{room}</li>
              ))}
            </ul>
          </section>
        )}

        {course.schedules.length > 0 && (
          <section className="enrolled-courses__modal-section" aria-label="Schedule">
            <h4 className="enrolled-courses__modal-section-title">Schedule</h4>
            <ul className="enrolled-courses__schedule-list">
              {course.schedules.map((schedule) => (
                <li key={schedule.id} className="enrolled-courses__schedule-item">
                  <span className="enrolled-courses__schedule-time">{schedule.label}</span>
                  <span className="enrolled-courses__schedule-room">{schedule.room}</span>
                  {schedule.facultyName && (
                    <span className="enrolled-courses__schedule-faculty">{schedule.facultyName}</span>
                  )}
                  {schedule.audienceContext && (
                    <span className="enrolled-courses__schedule-context">{schedule.audienceContext}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

function EnrolledCourses() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function loadCourses() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getStudentEnrolledCourses(profile)

        if (!isCancelled) {
          setCourses(data.courses)
          setProfileIncomplete(data.profileIncomplete)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setCourses([])
          setError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadCourses()

    return () => {
      isCancelled = true
    }
  }, [profile])

  const filteredCourses = useMemo(
    () => filterEnrolledCourses(courses, { searchQuery, categoryFilter }),
    [courses, searchQuery, categoryFilter],
  )

  const groupedCourses = useMemo(
    () => groupCoursesByCategory(filteredCourses),
    [filteredCourses],
  )

  const showGroupedSections = categoryFilter === 'all' && !searchQuery.trim()

  return (
    <section className="enrolled-courses" aria-labelledby="enrolled-courses-title">
      <div className="enrolled-courses__header">
        <div>
          <h2 id="enrolled-courses-title" className="enrolled-courses__title">
            Enrolled Courses
          </h2>
          <p className="enrolled-courses__subtitle">
            Your courses for the current academic term
          </p>
        </div>
        {!isLoading && !error && courses.length > 0 && (
          <span className="suc-badge suc-badge--primary">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </span>
        )}
      </div>

      {profileIncomplete && (
        <div className="suc-alert suc-alert--warning enrolled-courses__alert" role="status">
          <div>
            <p className="suc-alert__title">Academic setup required</p>
            <p>Complete your academic setup to view enrolled courses.</p>
          </div>
        </div>
      )}

      {!profileIncomplete && (
        <div className="enrolled-courses__toolbar suc-card">
          <label className="suc-label enrolled-courses__search-label" htmlFor="enrolled-courses-search">
            Search enrolled courses
          </label>
          <input
            id="enrolled-courses-search"
            className="suc-input enrolled-courses__search-input"
            type="search"
            placeholder="Search enrolled courses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={isLoading || Boolean(error)}
          />

          <div className="enrolled-courses__filters" role="group" aria-label="Course category filters">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`enrolled-courses__filter-chip ${
                  categoryFilter === filter.id ? 'enrolled-courses__filter-chip--active' : ''
                }`}
                onClick={() => setCategoryFilter(filter.id)}
                disabled={isLoading || Boolean(error)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <LoadingState />}

      {!isLoading && error && (
        <ErrorState message={error.message ?? 'Please try again in a moment.'} />
      )}

      {!isLoading && !error && !profileIncomplete && courses.length === 0 && (
        <EmptyState message="No enrolled courses found for your current academic configuration." />
      )}

      {!isLoading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <EmptyState message="No courses match your search or filter." />
      )}

      {!isLoading && !error && filteredCourses.length > 0 && (
        <div className="enrolled-courses__content">
          {showGroupedSections ? (
            groupedCourses.map((group) => (
              <section key={group.key} className="enrolled-courses__group" aria-label={group.label}>
                <h3 className="enrolled-courses__group-title">{group.label}</h3>
                <div className="enrolled-courses__grid">
                  {group.courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onSelect={setSelectedCourse}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="enrolled-courses__grid">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={setSelectedCourse}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </section>
  )
}

export default EnrolledCourses
