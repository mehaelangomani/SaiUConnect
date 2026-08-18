import './FacultyAvailabilityGrid.css'

function AvailabilityLoadingState() {
  return (
    <div className="faculty-availability__status" role="status" aria-live="polite">
      <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
      <p className="faculty-availability__status-text">Loading faculty availability…</p>
    </div>
  )
}

function AvailabilityErrorState({ message }) {
  return (
    <div className="suc-alert suc-alert--error faculty-availability__alert" role="alert">
      <div>
        <p className="suc-alert__title">Could not load faculty availability</p>
        <p>{message}</p>
      </div>
    </div>
  )
}

function AvailabilityEmptyState({ message }) {
  return (
    <div className="faculty-availability__empty-state suc-card" role="status">
      <p>{message}</p>
    </div>
  )
}

function AvailabilityCell({ cell }) {
  if (cell.status === 'unavailable') {
    return (
      <td className="faculty-availability__cell faculty-availability__cell--unavailable">
        <div className="faculty-availability__cell-inner">
          <span className="faculty-availability__unavailable-label">—</span>
        </div>
      </td>
    )
  }

  if (cell.status === 'free') {
    return (
      <td className="faculty-availability__cell faculty-availability__cell--free">
        <div className="faculty-availability__cell-inner">
          <span className="suc-badge suc-badge--primary faculty-availability__free-badge">
            Free
          </span>
        </div>
      </td>
    )
  }

  return (
    <td className="faculty-availability__cell faculty-availability__cell--busy">
      <div className="faculty-availability__cell-inner">
        <span className="suc-badge suc-badge--default faculty-availability__busy-badge">
          Busy
        </span>
        {cell.busyInfo?.courseCode && (
          <span className="faculty-availability__course-code">{cell.busyInfo.courseCode}</span>
        )}
        {cell.busyInfo?.courseName && (
          <span className="faculty-availability__course-name">{cell.busyInfo.courseName}</span>
        )}
        {cell.busyInfo?.room && (
          <span className="faculty-availability__room">{cell.busyInfo.room}</span>
        )}
      </div>
    </td>
  )
}

function FreeTimeSummary({ freeSummary }) {
  if (freeSummary.length === 0) {
    return null
  }

  return (
    <aside className="faculty-availability__summary" aria-label="Free time summary">
      <h5 className="faculty-availability__summary-title">Free periods</h5>
      <ul className="faculty-availability__summary-list">
        {freeSummary.map((daySummary) => (
          <li key={daySummary.day} className="faculty-availability__summary-day">
            <span className="faculty-availability__summary-day-name">{daySummary.dayName}</span>
            <ul className="faculty-availability__summary-periods">
              {daySummary.periods.map((period) => (
                <li key={`${daySummary.day}-${period}`}>{period}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function FacultyAvailabilityGrid({ availability, isLoading, error }) {
  if (isLoading) {
    return <AvailabilityLoadingState />
  }

  if (error) {
    return (
      <AvailabilityErrorState
        message={error.message ?? 'Please try again in a moment.'}
      />
    )
  }

  if (!availability) {
    return null
  }

  if (availability.profileIncomplete) {
    return (
      <AvailabilityEmptyState message="Complete your academic setup to view faculty availability." />
    )
  }

  if (availability.termNotFound) {
    return (
      <AvailabilityErrorState message="Could not find a matching academic term for your current academic configuration." />
    )
  }

  if (availability.schoolNotFound) {
    return (
      <AvailabilityErrorState message="Could not find a matching school for your profile." />
    )
  }

  if (!availability.hasGrid) {
    return (
      <AvailabilityEmptyState message="No time slots are available to display faculty availability." />
    )
  }

  const hasFreeSlots = availability.freeSlots.length > 0

  return (
    <div className="faculty-availability">
      {!availability.hasClasses && (
        <AvailabilityEmptyState message="No published classes found for this faculty member in the current academic term." />
      )}

      {availability.hasClasses && !hasFreeSlots && (
        <AvailabilityEmptyState message="No free time slots found in the current timetable." />
      )}

      <div className="faculty-availability__matrix-wrap">
        <table className="faculty-availability__matrix">
          <thead>
            <tr>
              <th className="faculty-availability__time-header" scope="col">
                Time
              </th>
              {availability.dayNames.map((dayName) => (
                <th key={dayName} className="faculty-availability__day-header" scope="col">
                  {dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {availability.grid.map((row) => (
              <tr key={row.periodNumber}>
                <th className="faculty-availability__time-label" scope="row">
                  {row.timeLabel}
                </th>
                {row.cells.map((cell) => (
                  <AvailabilityCell key={`${row.periodNumber}-${cell.day}`} cell={cell} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FreeTimeSummary freeSummary={availability.freeSummary} />
    </div>
  )
}

export default FacultyAvailabilityGrid
