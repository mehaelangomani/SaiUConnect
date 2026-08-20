import { useEffect, useMemo, useState } from 'react'
import {
  getPeriodRowsFromTimeSlots,
  getTimeSlots,
  WEEKDAY_NUMBERS,
} from '../../lib/classroomService'
import { formatTimeSlotLabel, getYearLineDisplay } from '../../lib/timetableEditorService'
import { DAY_NAMES } from '../../lib/timetableUtils'
import '../timetable-editor/TimetableEditor.css'
import './FacultyTimetable.css'

const WEEKDAYS = WEEKDAY_NUMBERS.map((dayOfWeek) => ({
  dayOfWeek,
  label: DAY_NAMES[dayOfWeek],
}))

function defaultSelectedDay() {
  const today = new Date().getDay()
  return WEEKDAY_NUMBERS.includes(today) ? today : 1
}

function FacultyClassCard({ entry }) {
  return (
    <div className="timetable-editor__cell-btn timetable-editor__cell-btn--filled faculty-timetable__card">
      <span className="timetable-editor__cell-course">{entry.courseName}</span>
      <span className="timetable-editor__cell-section">{getYearLineDisplay(entry.year)}</span>
      {entry.sectionLabel && (
        <span className="timetable-editor__cell-section">{entry.sectionLabel}</span>
      )}
      <span className="timetable-editor__cell-room">{entry.room}</span>
    </div>
  )
}

function FacultyTimetable({ entries, isLoading, error, emptyMessage }) {
  const [selectedDay, setSelectedDay] = useState(defaultSelectedDay)
  const [timeSlots, setTimeSlots] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadSlots() {
      try {
        const slots = await getTimeSlots()
        if (!cancelled) {
          setTimeSlots(slots)
        }
      } catch {
        if (!cancelled) {
          setTimeSlots([])
        }
      }
    }

    loadSlots()
    return () => {
      cancelled = true
    }
  }, [])

  const periodRows = useMemo(() => {
    const fromCatalog = getPeriodRowsFromTimeSlots(timeSlots)
    if (fromCatalog.length > 0) {
      return fromCatalog
    }

    const unique = new Map()
    for (const entry of entries ?? []) {
      const key = entry.periodNumber ?? entry.startTime
      if (!unique.has(key)) {
        unique.set(key, {
          periodNumber: entry.periodNumber,
          startTime: entry.startTime,
          endTime: entry.endTime,
        })
      }
    }
    return [...unique.values()].sort((left, right) => {
      const leftKey = String(left.startTime ?? '')
      const rightKey = String(right.startTime ?? '')
      return leftKey.localeCompare(rightKey)
    })
  }, [timeSlots, entries])

  const weekdaySlots = useMemo(
    () => timeSlots.filter((slot) => WEEKDAY_NUMBERS.includes(slot.day_of_week)),
    [timeSlots],
  )

  const entriesForSelectedDay = useMemo(
    () => (entries ?? []).filter((entry) => entry.dayOfWeek === selectedDay),
    [entries, selectedDay],
  )

  if (isLoading) {
    return (
      <div className="faculty-timetable__status" role="status">
        <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
        <p>Loading timetable...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="suc-alert suc-alert--error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="faculty-timetable__empty suc-card" role="status">
        <p>{emptyMessage || 'No timetable entries found.'}</p>
      </div>
    )
  }

  return (
    <div className="faculty-timetable">
      <nav className="timetable-editor__day-tabs" aria-label="Weekday tabs">
        {WEEKDAYS.map((day) => (
          <button
            key={day.dayOfWeek}
            type="button"
            className={`timetable-editor__day-tab ${
              selectedDay === day.dayOfWeek ? 'timetable-editor__day-tab--active' : ''
            }`}
            onClick={() => setSelectedDay(day.dayOfWeek)}
          >
            {day.label}
          </button>
        ))}
      </nav>

      <div className="timetable-editor__grid-outer faculty-timetable__grid-outer">
        <div className="timetable-editor__grid-wrap">
          <table className="timetable-editor__grid">
            <thead>
              <tr>
                <th className="timetable-editor__corner">Time</th>
                <th className="timetable-editor__room-header faculty-timetable__class-header">
                  Class
                </th>
              </tr>
            </thead>
            <tbody>
              {periodRows.map((period) => {
                const slot = weekdaySlots.find(
                  (candidate) =>
                    candidate.day_of_week === selectedDay
                    && candidate.period_number === period.periodNumber,
                )
                const cellEntries = entriesForSelectedDay.filter((entry) => {
                  if (period.periodNumber != null && entry.periodNumber != null) {
                    return entry.periodNumber === period.periodNumber
                  }
                  return entry.startTime === period.startTime
                })

                return (
                  <tr key={`${selectedDay}-${period.periodNumber}-${period.startTime}`}>
                    <th className="timetable-editor__time-header" scope="row">
                      <span className="timetable-editor__header-label">
                        {slot
                          ? formatTimeSlotLabel(slot)
                          : formatTimeSlotLabel({
                              start_time: period.startTime,
                              end_time: period.endTime,
                            })}
                      </span>
                    </th>
                    <td className="timetable-editor__cell faculty-timetable__class-cell">
                      {cellEntries.length > 0 ? (
                        cellEntries.map((entry) => (
                          <FacultyClassCard key={entry.id} entry={entry} />
                        ))
                      ) : (
                        <div className="timetable-editor__cell-btn faculty-timetable__card" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FacultyTimetable
