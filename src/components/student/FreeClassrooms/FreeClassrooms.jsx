import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  formatRoomTypeLabel,
  getWeeklyFreeClassrooms,
} from '../../../lib/classroomService'
import './FreeClassrooms.css'

function LoadingState({ message }) {
  return (
    <div className="free-classrooms__status" role="status" aria-live="polite">
      <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
      <p className="free-classrooms__status-text">{message}</p>
    </div>
  )
}

function ErrorState({ title, message }) {
  return (
    <div className="suc-alert suc-alert--error free-classrooms__alert" role="alert">
      <div>
        <p className="suc-alert__title">{title}</p>
        <p>{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="free-classrooms__empty-state suc-card" role="status">
      <p>{message}</p>
    </div>
  )
}

function RoomDetailsPopover({ room, cell, onClose }) {
  return (
    <>
      <button
        type="button"
        className="free-classrooms__popover-backdrop"
        onClick={onClose}
        aria-label="Close room details"
      />
      <div className="free-classrooms__popover suc-card" role="dialog" aria-modal="true">
        <div className="free-classrooms__popover-header">
          <h3 className="free-classrooms__popover-title">{room.code}</h3>
          <button type="button" className="free-classrooms__popover-close" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="free-classrooms__popover-name">{room.name}</p>
        <dl className="free-classrooms__popover-meta">
          <div>
            <dt>Day</dt>
            <dd>{cell.dayName}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{cell.timeLabel}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{formatRoomTypeLabel(room.roomType)}</dd>
          </div>
        </dl>
        <span className="suc-badge suc-badge--primary">Free</span>
      </div>
    </>
  )
}

function GridCell({ cell, onRoomSelect }) {
  return (
    <td className="free-classrooms__cell">
      <div className="free-classrooms__cell-inner">
        <span className="suc-badge suc-badge--primary free-classrooms__free-badge">Free</span>

        {cell.freeRooms.length === 0 ? (
          <p className="free-classrooms__cell-empty">No free rooms</p>
        ) : (
          <ul className="free-classrooms__room-list">
            {cell.freeRooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  className="free-classrooms__room-btn"
                  onClick={() => onRoomSelect(room, cell)}
                >
                  {room.code}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </td>
  )
}

function FreeClassrooms() {
  const { profile } = useAuth()
  const [weeklyData, setWeeklyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)

  const profileKey = useMemo(
    () => [
      profile?.school,
      profile?.academic_year,
      profile?.semester,
      roomTypeFilter,
    ].join('|'),
    [profile, roomTypeFilter],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadWeeklyAvailability() {
      if (!profile) {
        setWeeklyData(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await getWeeklyFreeClassrooms(profile, {
          roomType: roomTypeFilter || undefined,
        })

        if (!isCancelled) {
          setWeeklyData(data)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setWeeklyData(null)
          setError(loadError)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadWeeklyAvailability()

    return () => {
      isCancelled = true
    }
  }, [profile, profileKey, roomTypeFilter])

  const profileIncomplete = !profile?.school
  const hasGrid = weeklyData?.grid?.length > 0
  const totalFreeCells = weeklyData?.grid?.reduce(
    (count, row) => count + row.cells.filter((cell) => cell.freeRooms.length > 0).length,
    0,
  ) ?? 0

  const handleRoomSelect = (room, cell) => {
    setSelectedRoom(room)
    setSelectedCell(cell)
  }

  const handleClosePopover = () => {
    setSelectedRoom(null)
    setSelectedCell(null)
  }

  return (
    <section className="free-classrooms" aria-labelledby="free-classrooms-title">
      <div className="free-classrooms__header">
        <div>
          <h2 id="free-classrooms-title" className="free-classrooms__title">
            Free Classrooms
          </h2>
          <p className="free-classrooms__subtitle">
            Find available classrooms across the week
          </p>
        </div>
        {!isLoading && !error && hasGrid && (
          <span className="suc-badge suc-badge--primary">
            {weeklyData.availableRooms.length} rooms tracked
          </span>
        )}
      </div>

      {profileIncomplete && (
        <div className="suc-alert suc-alert--warning free-classrooms__alert" role="status">
          <div>
            <p className="suc-alert__title">Academic setup required</p>
            <p>Complete your academic setup to view free classrooms.</p>
          </div>
        </div>
      )}

      {!profileIncomplete && (
        <div className="free-classrooms__filters suc-card">
          <div className="free-classrooms__filter">
            <label className="suc-label" htmlFor="free-classrooms-room-type">
              Room type
            </label>
            <select
              id="free-classrooms-room-type"
              className="suc-select"
              value={roomTypeFilter}
              onChange={(event) => setRoomTypeFilter(event.target.value)}
            >
              <option value="">All types</option>
              {(weeklyData?.roomTypeOptions ?? []).map((roomType) => (
                <option key={roomType} value={roomType}>
                  {formatRoomTypeLabel(roomType)}
                </option>
              ))}
            </select>
          </div>

        </div>
      )}

      {isLoading && <LoadingState message="Loading classroom availability…" />}

      {!isLoading && error && (
        <ErrorState
          title="Could not load classroom availability"
          message={error.message ?? 'Please try again in a moment.'}
        />
      )}

      {!isLoading && !error && weeklyData?.termNotFound && (
        <ErrorState
          title="Timetable unavailable"
          message="The timetable is currently unavailable because no active timetable exists."
        />
      )}

      {!isLoading && !error && weeklyData?.schoolNotFound && (
        <ErrorState
          title="School not found"
          message="Could not find a matching school for your profile."
        />
      )}

      {!isLoading && !error && weeklyData && !weeklyData.termNotFound && !weeklyData.schoolNotFound && !hasGrid && (
        <EmptyState message="No time slots are available to display classroom availability." />
      )}

      {!isLoading && !error && hasGrid && (
        <>
          {weeklyData.availableRooms.length === 0 && (
            <EmptyState message="No available rooms match your current filters." />
          )}

          {weeklyData.availableRooms.length > 0 && totalFreeCells === 0 && (
            <EmptyState message="No free rooms are available across the week for your current filters." />
          )}

          <div className="free-classrooms__matrix-wrap">
            <table className="free-classrooms__matrix">
              <thead>
                <tr>
                  <th className="free-classrooms__time-header" scope="col">
                    Time
                  </th>
                  {weeklyData.dayNames.map((dayName) => (
                    <th key={dayName} className="free-classrooms__day-header" scope="col">
                      {dayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyData.grid.map((row) => (
                  <tr key={row.periodNumber}>
                    <th className="free-classrooms__time-label" scope="row">
                      {row.timeLabel}
                    </th>
                    {row.cells.map((cell) => (
                      <GridCell
                        key={`${row.periodNumber}-${cell.day}`}
                        cell={cell}
                        onRoomSelect={handleRoomSelect}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedRoom && selectedCell && (
        <RoomDetailsPopover
          room={selectedRoom}
          cell={selectedCell}
          onClose={handleClosePopover}
        />
      )}
    </section>
  )
}

export default FreeClassrooms
