import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import ConfirmationDialog from '../common/ConfirmationDialog/ConfirmationDialog'
import SaiUniversityMark from '../SaiUniversityMark/SaiUniversityMark'
import { ensureCatalogBootstrap } from '../../lib/catalogBootstrapService'
import {
  countEntriesForRoom,
  countEntriesForTimeSlot,
  createRoom,
  createTimeSlot,
  deactivateRoom,
  deleteTimeSlot,
  fetchActiveAcademicTerm,
  fetchAllCourses,
  fetchAllFaculty,
  fetchAllRooms,
  fetchAllSchools,
  fetchAllSections,
  fetchTimeSlotsForDay,
  updateRoom,
  updateTimeSlot,
} from '../../lib/adminCatalogService'
import {
  fetchDayTimetableData,
  formatTimeSlotLabel,
  getAudienceLineDisplay,
  getYearLineDisplay,
  parseTimeRangeInput,
} from '../../lib/timetableEditorService'
import { DAY_NAMES } from '../../lib/timetableUtils'
import TimetableCellEditor from './TimetableCellEditor'
import AdminNotificationButton from './AdminNotificationButton'
import './TimetableEditor.css'

const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
]

function TimetableEditor({ mode = 'admin' }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [selectedDay, setSelectedDay] = useState(1)
  const [academicTerm, setAcademicTerm] = useState(null)
  const [rooms, setRooms] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [entryMap, setEntryMap] = useState(new Map())
  const [schools, setSchools] = useState([])
  const [faculty, setFaculty] = useState([])
  const [courses, setCourses] = useState([])
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cellEditor, setCellEditor] = useState(null)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [roomEditValue, setRoomEditValue] = useState('')
  const [slotEditValue, setSlotEditValue] = useState('')
  const [confirmState, setConfirmState] = useState(null)
  const [confirmError, setConfirmError] = useState(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [newSlotRange, setNewSlotRange] = useState('')
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)

  const profilePath = mode === 'admin' ? '/admin/profile' : '/editor/profile'
  const displayName = profile?.name || profile?.email || 'User'
  const initial = profile?.initial || displayName.charAt(0).toUpperCase()

  const refreshCatalog = useCallback(async () => {
    const [schoolData, facultyData, courseData, sectionData] = await Promise.all([
      fetchAllSchools(),
      fetchAllFaculty(),
      fetchAllCourses(),
      fetchAllSections(),
    ])
    setSchools(schoolData)
    setFaculty(facultyData)
    setCourses(courseData)
    setSections(sectionData)
  }, [])

  const loadDay = useCallback(async () => {
    if (!academicTerm?.id) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [roomData, slotData, timetableData] = await Promise.all([
        fetchAllRooms(),
        fetchTimeSlotsForDay(selectedDay),
        fetchDayTimetableData(selectedDay, academicTerm.id),
      ])

      setRooms(roomData)
      setTimeSlots(slotData)
      setEntryMap(timetableData.entryMap)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setIsLoading(false)
    }
  }, [academicTerm?.id, selectedDay])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        try {
          await ensureCatalogBootstrap()
        } catch (bootstrapError) {
          console.warn('Catalog bootstrap skipped:', bootstrapError.message)
        }
        const term = await fetchActiveAcademicTerm()
        if (!cancelled) {
          setAcademicTerm(term)
        }
        await refreshCatalog()
      } catch (initError) {
        if (!cancelled) {
          setError(initError)
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [refreshCatalog])

  useEffect(() => {
    loadDay()
  }, [loadDay])

  const handleCellClick = (timeSlot, room) => {
    const key = `${timeSlot.id}:${room.id}`
    const entry = entryMap.get(key) ?? null
    setCellEditor({
      entry,
      cellContext: {
        timeSlotId: timeSlot.id,
        roomId: room.id,
        dayLabel: DAY_NAMES[selectedDay],
        timeLabel: formatTimeSlotLabel(timeSlot),
        roomLabel: room.code,
      },
    })
  }

  const handleAddRoom = async () => {
    const trimmed = newRoomName.trim()
    if (!trimmed) return
    if (rooms.some((room) => room.code.toLowerCase() === trimmed.toLowerCase())) {
      setError(new Error('That room already exists.'))
      return
    }
    await createRoom(trimmed, trimmed)
    setNewRoomName('')
    setShowAddRoom(false)
    await loadDay()
  }

  const handleAddSlot = async () => {
    const parsed = parseTimeRangeInput(newSlotRange)
    if (!parsed) {
      setError(new Error('Enter a time range like 9:15 AM - 10:10 AM'))
      return
    }
    await createTimeSlot({
      dayOfWeek: selectedDay,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    })
    setNewSlotRange('')
    setShowAddSlot(false)
    await loadDay()
  }

  const handleDeleteRoom = async (room) => {
    const usageCount = await countEntriesForRoom(room.id)
    setConfirmError(null)
    setConfirmState({
      title: 'Remove room column?',
      message:
        usageCount > 0
          ? `${room.code} is used by ${usageCount} timetable entr${usageCount === 1 ? 'y' : 'ies'}. Removing it will deactivate the room but not delete existing entries.`
          : `Remove ${room.code} from the timetable columns?`,
      onConfirm: async () => {
        try {
          await deactivateRoom(room.id)
          setConfirmState(null)
          setConfirmError(null)
          await loadDay()
        } catch (deleteError) {
          setConfirmError(deleteError.message ?? 'Could not deactivate room. Please try again.')
        }
      },
    })
  }

  const handleDeleteSlot = async (slot) => {
    const usageCount = await countEntriesForTimeSlot(slot.id)
    setConfirmState({
      title: 'Remove time slot?',
      message:
        usageCount > 0
          ? `This slot is used by ${usageCount} class${usageCount === 1 ? '' : 'es'}. Deleting it may fail if entries still reference it.`
          : `Remove ${formatTimeSlotLabel(slot)} from ${DAY_NAMES[selectedDay]}?`,
      onConfirm: async () => {
        await deleteTimeSlot(slot.id)
        setConfirmState(null)
        await loadDay()
      },
    })
  }

  const handleSaveRoomHeader = async (roomId) => {
    const trimmed = roomEditValue.trim()
    if (!trimmed) return
    await updateRoom(roomId, { code: trimmed, name: trimmed })
    setEditingRoomId(null)
    await loadDay()
  }

  const handleSaveSlotHeader = async (slotId) => {
    const parsed = parseTimeRangeInput(slotEditValue)
    if (!parsed) {
      setError(new Error('Enter a valid time range like 9:15 AM - 10:10 AM'))
      return
    }
    await updateTimeSlot(slotId, {
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    })
    setEditingSlotId(null)
    await loadDay()
  }

  return (
    <div className="timetable-editor">
      <div className="timetable-editor__top">
        <header className="timetable-editor__header suc-header">
          <div className="timetable-editor__brand">
            <SaiUniversityMark className="timetable-editor__mark" />
            <div>
              <span className="timetable-editor__brand-name">SaiUConnect</span>
              <span className="timetable-editor__brand-role">
                {mode === 'admin' ? 'Admin Timetable' : 'Editor Timetable'}
              </span>
            </div>
          </div>

          <div className="timetable-editor__header-actions">
            {academicTerm && mode !== 'admin' && (
              <span className="timetable-editor__term">{academicTerm.label}</span>
            )}
            {mode === 'admin' && <AdminNotificationButton />}
            <button
              type="button"
              className="timetable-editor__profile-btn"
              onClick={() => navigate(profilePath)}
              aria-label="Open profile"
            >
              <span className="timetable-editor__avatar">{initial}</span>
            </button>
          </div>
        </header>

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
      </div>

      {error && (
        <div className="timetable-editor__alert suc-alert suc-alert--error" role="alert">
          <p>{error.message ?? 'Something went wrong.'}</p>
        </div>
      )}

      <div className="timetable-editor__grid-outer">
        <div className="timetable-editor__grid-wrap">
        {isLoading ? (
          <div className="timetable-editor__loading" role="status">
            <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
            <p>Loading {DAY_NAMES[selectedDay]} timetable…</p>
          </div>
        ) : (
          <table className="timetable-editor__grid">
            <thead>
              <tr>
                <th className="timetable-editor__corner">Time</th>
                {rooms.map((room) => (
                  <th key={room.id} className="timetable-editor__room-header">
                    <div className="timetable-editor__header-cell">
                      {editingRoomId === room.id ? (
                        <input
                          className="suc-input suc-input--sm"
                          value={roomEditValue}
                          onChange={(event) => setRoomEditValue(event.target.value)}
                          onBlur={() => handleSaveRoomHeader(room.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleSaveRoomHeader(room.id)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="timetable-editor__header-label"
                          onClick={() => {
                            setEditingRoomId(room.id)
                            setRoomEditValue(room.code)
                          }}
                        >
                          {room.code}
                        </button>
                      )}
                      <button
                        type="button"
                        className="timetable-editor__remove-btn"
                        onClick={() => handleDeleteRoom(room)}
                        aria-label={`Remove ${room.code}`}
                      >
                        −
                      </button>
                    </div>
                  </th>
                ))}
                <th className="timetable-editor__add-col">
                  {showAddRoom ? (
                    <div className="timetable-editor__inline-add">
                      <input
                        className="suc-input suc-input--sm"
                        value={newRoomName}
                        onChange={(event) => setNewRoomName(event.target.value)}
                        placeholder="AB3 101"
                        autoFocus
                      />
                      <button type="button" className="suc-btn suc-btn--primary suc-btn--sm" onClick={handleAddRoom}>
                        Add
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="timetable-editor__add-btn" onClick={() => setShowAddRoom(true)}>
                      +
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id}>
                  <th className="timetable-editor__time-header">
                    <div className="timetable-editor__header-cell">
                      {editingSlotId === slot.id ? (
                        <input
                          className="suc-input suc-input--sm"
                          value={slotEditValue}
                          onChange={(event) => setSlotEditValue(event.target.value)}
                          onBlur={() => handleSaveSlotHeader(slot.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleSaveSlotHeader(slot.id)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="timetable-editor__header-label"
                          onClick={() => {
                            setEditingSlotId(slot.id)
                            setSlotEditValue(formatTimeSlotLabel(slot))
                          }}
                        >
                          {formatTimeSlotLabel(slot)}
                        </button>
                      )}
                      <button
                        type="button"
                        className="timetable-editor__remove-btn"
                        onClick={() => handleDeleteSlot(slot)}
                        aria-label={`Remove ${formatTimeSlotLabel(slot)}`}
                      >
                        −
                      </button>
                    </div>
                  </th>
                  {rooms.map((room) => {
                    const entry = entryMap.get(`${slot.id}:${room.id}`)
                    const audienceLine = entry ? getAudienceLineDisplay(entry.audiences) : null
                    return (
                      <td key={room.id} className="timetable-editor__cell">
                        <button
                          type="button"
                          className={`timetable-editor__cell-btn ${
                            entry ? 'timetable-editor__cell-btn--filled' : ''
                          }`}
                          onClick={() => handleCellClick(slot, room)}
                        >
                          {entry ? (
                            <>
                              <span className="timetable-editor__cell-course">{entry.courseName}</span>
                              <span className="timetable-editor__cell-section">{getYearLineDisplay(entry.year)}</span>
                              {audienceLine && (
                                <span className="timetable-editor__cell-section">{audienceLine}</span>
                              )}
                              <span className="timetable-editor__cell-faculty">{entry.facultyName}</span>
                              <span className="timetable-editor__cell-room">{entry.roomCode}</span>
                            </>
                          ) : null}
                        </button>
                      </td>
                    )
                  })}
                  <td className="timetable-editor__spacer" />
                </tr>
              ))}
              <tr>
                <th className="timetable-editor__add-row">
                  {showAddSlot ? (
                    <div className="timetable-editor__inline-add">
                      <input
                        className="suc-input suc-input--sm"
                        value={newSlotRange}
                        onChange={(event) => setNewSlotRange(event.target.value)}
                        placeholder="9:15 AM - 10:10 AM"
                        autoFocus
                      />
                      <button type="button" className="suc-btn suc-btn--primary suc-btn--sm" onClick={handleAddSlot}>
                        Add
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="timetable-editor__add-btn" onClick={() => setShowAddSlot(true)}>
                      +
                    </button>
                  )}
                </th>
                <td colSpan={rooms.length + 1} />
              </tr>
            </tbody>
          </table>
        )}
        </div>
      </div>

      <TimetableCellEditor
        isOpen={Boolean(cellEditor)}
        cellContext={cellEditor?.cellContext}
        entry={cellEditor?.entry}
        schools={schools}
        faculty={faculty}
        courses={courses}
        sections={sections}
        academicTermId={academicTerm?.id}
        onClose={() => setCellEditor(null)}
        onSaved={loadDay}
        onRefreshCatalog={refreshCatalog}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        errorMessage={confirmError}
        confirmLabel="Confirm"
        onConfirm={confirmState?.onConfirm}
        onCancel={() => {
          setConfirmState(null)
          setConfirmError(null)
        }}
      />
    </div>
  )
}

export default TimetableEditor
