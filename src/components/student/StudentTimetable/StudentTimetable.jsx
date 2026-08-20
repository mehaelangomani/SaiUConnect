import { useStudentTimetable } from '../../../hooks/useStudentTimetable'
import { groupTimetableByDay } from '../../../lib/timetableUtils'
import './StudentTimetable.css'

function TimetableLoadingState() {
  return (
    <div className="student-timetable__status" role="status" aria-live="polite">
      <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
      <p className="student-timetable__status-text">Loading your timetable…</p>
    </div>
  )
}

function TimetableErrorState({ error }) {
  const message = error?.message ?? 'Unable to load your timetable right now.'

  return (
    <div className="suc-alert suc-alert--error student-timetable__alert" role="alert">
      <div>
        <p className="suc-alert__title">Could not load timetable</p>
        <p>{message}</p>
      </div>
    </div>
  )
}

function TimetableEmptyState() {
  return (
    <div className="student-timetable__empty-state suc-card" role="status">
      <p>No timetable classes found for your current academic configuration.</p>
    </div>
  )
}

function TimetableUnavailableState() {
  return (
    <div className="suc-alert suc-alert--error student-timetable__alert" role="alert">
      <div>
        <p className="suc-alert__title">Timetable unavailable</p>
        <p>The timetable is currently unavailable because no active timetable exists.</p>
      </div>
    </div>
  )
}

function TimetableEntryCard({ entry }) {
  return (
    <li className="student-timetable__entry">
      <span className="student-timetable__time">
        {entry.startTime} – {entry.endTime}
      </span>
      <span className="student-timetable__course">
        {entry.courseCode} · {entry.courseName}
      </span>
      <span className="student-timetable__faculty">{entry.faculty}</span>
      <span className="student-timetable__room">{entry.room}</span>
      <span className="suc-badge suc-badge--default student-timetable__category">
        {entry.type}
      </span>
    </li>
  )
}

function StudentTimetable() {
  const { entries, isLoading, error, termNotFound } = useStudentTimetable()
  const weeklySchedule = groupTimetableByDay(entries)
  const hasClasses = entries.length > 0

  return (
    <section className="student-timetable" aria-labelledby="student-timetable-title">
      <div className="student-timetable__header">
        <h2 id="student-timetable-title" className="student-timetable__title">
          Weekly Timetable
        </h2>
        {!isLoading && !error && hasClasses && (
          <span className="suc-badge suc-badge--primary">
            {entries.length} {entries.length === 1 ? 'class' : 'classes'}
          </span>
        )}
      </div>

      {isLoading && <TimetableLoadingState />}

      {!isLoading && error && <TimetableErrorState error={error} />}

      {!isLoading && !error && termNotFound && <TimetableUnavailableState />}

      {!isLoading && !error && !termNotFound && !hasClasses && <TimetableEmptyState />}

      {!isLoading && !error && !termNotFound && hasClasses && (
        <div className="student-timetable__grid">
          {weeklySchedule.map(({ day, classes }) => (
            <div key={day} className="student-timetable__day suc-card">
              <h3 className="student-timetable__day-title">{day}</h3>

              {classes.length === 0 ? (
                <p className="student-timetable__empty">No classes</p>
              ) : (
                <ul className="student-timetable__list">
                  {classes.map((entry) => (
                    <TimetableEntryCard key={entry.id} entry={entry} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default StudentTimetable
