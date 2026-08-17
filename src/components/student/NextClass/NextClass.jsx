import { useStudentTimetable } from '../../../hooks/useStudentTimetable'
import { getNextClass } from '../../../lib/timetableUtils'
import './NextClass.css'

function NextClass() {
  const { entries, isLoading, error } = useStudentTimetable()
  const nextClass = getNextClass(entries)

  return (
    <section className="next-class suc-card next-class--highlight" aria-labelledby="next-class-title">
      <h2 id="next-class-title" className="next-class__title">
        Next Class
      </h2>

      {isLoading && (
        <p className="next-class__empty" role="status">
          Loading next class…
        </p>
      )}

      {!isLoading && error && (
        <p className="next-class__empty" role="alert">
          Unable to load next class.
        </p>
      )}

      {!isLoading && !error && nextClass && (
        <div className="next-class__content">
          <div className="next-class__code">{nextClass.courseCode}</div>
          <p className="next-class__name">{nextClass.courseName}</p>
          <dl className="next-class__details">
            <div>
              <dt>Time</dt>
              <dd>
                {nextClass.startTime} – {nextClass.endTime}
              </dd>
            </div>
            <div>
              <dt>Room</dt>
              <dd>{nextClass.room}</dd>
            </div>
            <div>
              <dt>Faculty</dt>
              <dd>{nextClass.faculty}</dd>
            </div>
            <div>
              <dt>Day</dt>
              <dd>{nextClass.day}</dd>
            </div>
          </dl>
          <span className="suc-badge suc-badge--info">{nextClass.type}</span>
        </div>
      )}

      {!isLoading && !error && !nextClass && (
        <p className="next-class__empty">No upcoming classes found.</p>
      )}
    </section>
  )
}

export default NextClass
