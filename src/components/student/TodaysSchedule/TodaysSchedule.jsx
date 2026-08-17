import { useStudentTimetable } from '../../../hooks/useStudentTimetable'
import { getTodayName, getTodaysClasses } from '../../../lib/timetableUtils'
import './TodaysSchedule.css'

function TodaysSchedule() {
  const { entries, isLoading, error } = useStudentTimetable()
  const todayName = getTodayName()
  const todaysClasses = getTodaysClasses(entries)

  return (
    <section className="todays-schedule suc-card" aria-labelledby="todays-schedule-title">
      <div className="todays-schedule__header">
        <h2 id="todays-schedule-title" className="todays-schedule__title">
          Today&apos;s Schedule
        </h2>
        <span className="suc-badge suc-badge--primary">{todayName}</span>
      </div>

      {isLoading && (
        <p className="todays-schedule__empty" role="status">
          Loading today&apos;s classes…
        </p>
      )}

      {!isLoading && error && (
        <p className="todays-schedule__empty" role="alert">
          Unable to load today&apos;s schedule.
        </p>
      )}

      {!isLoading && !error && todaysClasses.length === 0 && (
        <p className="todays-schedule__empty">No classes scheduled for today.</p>
      )}

      {!isLoading && !error && todaysClasses.length > 0 && (
        <ul className="todays-schedule__list">
          {todaysClasses.map((entry) => (
            <li key={entry.id} className="todays-schedule__item">
              <div className="todays-schedule__time">
                <span>{entry.startTime}</span>
                <span className="todays-schedule__time-sep">–</span>
                <span>{entry.endTime}</span>
              </div>
              <div className="todays-schedule__details">
                <p className="todays-schedule__course">
                  <strong>{entry.courseCode}</strong> — {entry.courseName}
                </p>
                <p className="todays-schedule__meta">
                  {entry.room} · {entry.faculty}
                </p>
              </div>
              <span className="suc-badge suc-badge--default">{entry.type}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TodaysSchedule
