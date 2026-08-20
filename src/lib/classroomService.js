import { supabase } from './supabase'
import { fetchActiveAcademicTerm, resolveSchool } from './academicTermService'
import { DAY_NAMES, formatTimeValue } from './timetableUtils'

export const WEEKDAY_NUMBERS = [1, 2, 3, 4, 5]

function normalizeRoom(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    roomType: row.room_type,
    capacity: row.capacity,
    availabilityStatus: row.availability_status,
    isActive: row.is_active,
  }
}

function formatRoomTypeLabel(roomType) {
  if (!roomType) {
    return 'Room'
  }

  return roomType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatTimeSlotLabel(slot) {
  const start = formatTimeValue(slot.start_time)
  const end = formatTimeValue(slot.end_time)
  const period = slot.period_number ? `Period ${slot.period_number}` : null

  return period ? `${start} – ${end} (${period})` : `${start} – ${end}`
}

export function formatTimeRange(startTime, endTime) {
  return `${formatTimeValue(startTime)} – ${formatTimeValue(endTime)}`
}

/**
 * Fetch all time slots from Supabase, ordered by day and period.
 */
export async function getTimeSlots() {
  const { data, error } = await supabase
    .from('time_slots')
    .select('id, day_of_week, start_time, end_time, period_number, label')
    .order('day_of_week', { ascending: true })
    .order('period_number', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

function getWeekdaySlots(timeSlots) {
  return timeSlots.filter((slot) => WEEKDAY_NUMBERS.includes(slot.day_of_week))
}

/**
 * Build period rows from Monday slots (period_number + start/end times).
 */
export function getPeriodRowsFromTimeSlots(timeSlots) {
  const mondaySlots = getWeekdaySlots(timeSlots)
    .filter((slot) => slot.day_of_week === 1)
    .sort((left, right) => left.period_number - right.period_number)

  return mondaySlots.map((slot) => ({
    periodNumber: slot.period_number,
    startTime: slot.start_time,
    endTime: slot.end_time,
    timeLabel: formatTimeRange(slot.start_time, slot.end_time),
  }))
}

function applyRoomFilters(rooms, filters = {}) {
  let filtered = rooms

  if (filters.roomType) {
    filtered = filtered.filter((room) => room.roomType === filters.roomType)
  }

  if (filters.minCapacity) {
    const minimum = Number(filters.minCapacity)
    if (!Number.isNaN(minimum) && minimum > 0) {
      filtered = filtered.filter(
        (room) => room.capacity != null && room.capacity >= minimum,
      )
    }
  }

  return filtered
}

function buildOccupiedRoomsBySlot(entries = []) {
  const occupiedBySlot = new Map()

  for (const entry of entries) {
    if (!occupiedBySlot.has(entry.time_slot_id)) {
      occupiedBySlot.set(entry.time_slot_id, new Set())
    }

    occupiedBySlot.get(entry.time_slot_id).add(entry.room_id)
  }

  return occupiedBySlot
}

function buildWeeklyGrid(timeSlots, availableRooms, occupiedBySlot) {
  const weekdaySlots = getWeekdaySlots(timeSlots)
  const periodRows = getPeriodRowsFromTimeSlots(timeSlots)

  return periodRows.map((period) => ({
    periodNumber: period.periodNumber,
    timeLabel: period.timeLabel,
    cells: WEEKDAY_NUMBERS.map((day) => {
      const slot = weekdaySlots.find(
        (candidate) =>
          candidate.day_of_week === day
          && candidate.period_number === period.periodNumber,
      )

      if (!slot) {
        return {
          day,
          dayName: DAY_NAMES[day],
          timeSlotId: null,
          timeLabel: period.timeLabel,
          freeRooms: [],
        }
      }

      const occupiedRoomIds = occupiedBySlot.get(slot.id) ?? new Set()
      const freeRooms = availableRooms.filter((room) => !occupiedRoomIds.has(room.id))

      return {
        day,
        dayName: DAY_NAMES[day],
        timeSlotId: slot.id,
        timeLabel: formatTimeRange(slot.start_time, slot.end_time),
        freeRooms,
      }
    }),
  }))
}

/**
 * Fetch weekly free-classroom availability for a student profile.
 * Uses three scoped Supabase queries (rooms, time slots, published entries).
 */
export async function getWeeklyFreeClassrooms(profile, filters = {}) {
  if (!profile?.school) {
    return {
      grid: [],
      days: WEEKDAY_NUMBERS,
      dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
      availableRooms: [],
      roomTypeOptions: [],
      term: null,
      school: null,
      profileIncomplete: true,
      termNotFound: false,
      schoolNotFound: false,
    }
  }

  const [term, school, timeSlots, roomsResult] = await Promise.all([
    fetchActiveAcademicTerm(),
    resolveSchool(profile),
    getTimeSlots(),
    supabase
      .from('rooms')
      .select('id, code, name, room_type, capacity, availability_status, is_active')
      .eq('is_active', true)
      .order('code', { ascending: true }),
  ])

  if (roomsResult.error) {
    throw roomsResult.error
  }

  if (!term) {
    return {
      grid: [],
      days: WEEKDAY_NUMBERS,
      dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
      availableRooms: [],
      roomTypeOptions: [],
      term: null,
      school,
      profileIncomplete: false,
      termNotFound: true,
      schoolNotFound: false,
    }
  }

  if (!school) {
    return {
      grid: [],
      days: WEEKDAY_NUMBERS,
      dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
      availableRooms: [],
      roomTypeOptions: [],
      term,
      school: null,
      profileIncomplete: false,
      termNotFound: false,
      schoolNotFound: true,
    }
  }

  const normalizedRooms = (roomsResult.data ?? []).map(normalizeRoom)
  const eligibleRooms = normalizedRooms.filter(
    (room) => room.availabilityStatus === 'available',
  )
  const roomTypeOptions = [...new Set(eligibleRooms.map((room) => room.roomType))].sort()
  const filteredRooms = applyRoomFilters(eligibleRooms, filters)

  const weekdaySlots = getWeekdaySlots(timeSlots)
  const timeSlotIds = weekdaySlots.map((slot) => slot.id)

  let occupiedBySlot = new Map()

  if (timeSlotIds.length > 0) {
    const { data: occupiedEntries, error: occupiedError } = await supabase
      .from('timetable_entries')
      .select('room_id, time_slot_id')
      .eq('academic_term_id', term.id)
      .eq('school_id', school.id)
      .eq('is_published', true)
      .in('time_slot_id', timeSlotIds)

    if (occupiedError) {
      throw occupiedError
    }

    occupiedBySlot = buildOccupiedRoomsBySlot(occupiedEntries ?? [])
  }

  const grid = buildWeeklyGrid(timeSlots, filteredRooms, occupiedBySlot)

  return {
    grid,
    days: WEEKDAY_NUMBERS,
    dayNames: WEEKDAY_NUMBERS.map((day) => DAY_NAMES[day]),
    availableRooms: filteredRooms,
    roomTypeOptions,
    term,
    school,
    profileIncomplete: false,
    termNotFound: false,
    schoolNotFound: false,
  }
}

/**
 * Determine free classrooms for a single time slot (legacy helper).
 */
export async function getFreeClassrooms({ profile, timeSlotId }) {
  const weekly = await getWeeklyFreeClassrooms(profile)

  if (weekly.profileIncomplete || weekly.termNotFound || weekly.schoolNotFound) {
    return {
      freeRooms: [],
      occupiedRooms: [],
      unavailableRooms: [],
      term: weekly.term,
      school: weekly.school,
      profileIncomplete: weekly.profileIncomplete,
      termNotFound: weekly.termNotFound,
      schoolNotFound: weekly.schoolNotFound,
    }
  }

  const cell = weekly.grid
    .flatMap((row) => row.cells)
    .find((candidate) => candidate.timeSlotId === timeSlotId)

  return {
    freeRooms: cell?.freeRooms ?? [],
    occupiedRooms: [],
    unavailableRooms: [],
    term: weekly.term,
    school: weekly.school,
    profileIncomplete: false,
    termNotFound: false,
    schoolNotFound: false,
  }
}

export { formatRoomTypeLabel }
