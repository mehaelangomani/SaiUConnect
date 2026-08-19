import { supabase } from './supabase'

const COURSE_CATEGORY_MAP = {
  major: 'core',
  minor: 'minor',
  elective: 'elective',
  lab: 'lab',
}

const COURSE_CATEGORY_LABELS = {
  core: 'Major Course',
  minor: 'Minor Course',
  elective: 'Elective',
  lab: 'Lab',
}

export function getCourseCategoryLabel(category) {
  return COURSE_CATEGORY_LABELS[category] ?? 'Major Course'
}

export function getCourseCategoryValue(label) {
  const normalized = String(label ?? '').toLowerCase()
  if (normalized.includes('minor')) return 'minor'
  if (normalized.includes('elective')) return 'elective'
  if (normalized.includes('lab')) return 'lab'
  return 'core'
}

export async function fetchAllSchools(includeInactive = false) {
  let query = supabase.from('schools').select('id, code, name, is_active').order('code')
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createSchool(code, name) {
  const normalizedCode = String(code).trim().toUpperCase()
  const { data, error } = await supabase
    .from('schools')
    .insert({ code: normalizedCode, name: name || normalizedCode })
    .select('id, code, name, is_active')
    .single()
  if (error) throw error
  return data
}

export async function deactivateSchool(schoolId) {
  const normalizedId = String(schoolId ?? '').trim()
  if (!normalizedId) {
    throw new Error('Cannot deactivate school: missing database ID.')
  }

  const { data, error } = await supabase.rpc('deactivate_school', {
    p_school_id: normalizedId,
  })

  if (error) {
    throw error
  }

  return data
}

async function deactivateCatalogRow(table, rowId, entityName) {
  const normalizedId = String(rowId ?? '').trim()
  if (!normalizedId) {
    throw new Error(`Cannot deactivate ${entityName.toLowerCase()}: missing database ID.`)
  }

  const { data: existing, error: lookupError } = await supabase
    .from(table)
    .select('id')
    .eq('id', normalizedId)
    .eq('is_active', true)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (!existing?.id) {
    throw new Error(`${entityName} not found or already deactivated.`)
  }

  const { error: updateError } = await supabase
    .from(table)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', normalizedId)

  if (updateError) {
    throw updateError
  }

  return normalizedId
}

export async function fetchAllFaculty(includeInactive = false) {
  let query = supabase
    .from('faculty_members')
    .select('id, name, email, school_id, is_active')
    .order('name')
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createFacultyMember({ name, email, schoolId = null, department = null }) {
  const payload = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    school_id: schoolId,
  }
  if (department) {
    payload.department = String(department).trim()
  }
  const { data, error } = await supabase
    .from('faculty_members')
    .insert(payload)
    .select('id, name, email, school_id, is_active')
    .single()
  if (error) throw error
  return data
}

export async function deactivateFacultyMember(facultyId) {
  const normalizedId = String(facultyId ?? '').trim()
  if (!normalizedId) {
    throw new Error('Cannot deactivate faculty member: missing database ID.')
  }

  const { data, error } = await supabase.rpc('deactivate_faculty_member', {
    p_faculty_id: normalizedId,
  })

  if (error) {
    throw error
  }

  return data
}

function isAdminSectionCode(code) {
  return code === 'none' || /^\d+$/.test(String(code))
}

function sortSectionRows(sections) {
  return [...sections].sort((left, right) => {
    if (left.code === 'none') {
      return 1
    }
    if (right.code === 'none') {
      return -1
    }
    const leftNumber = Number.parseInt(left.code, 10)
    const rightNumber = Number.parseInt(right.code, 10)
    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
      return leftNumber - rightNumber
    }
    return left.label.localeCompare(right.label)
  })
}

export async function fetchAllSections(includeInactive = false) {
  let query = supabase.from('sections').select('id, code, label, is_active').order('code')
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []).filter((section) => isAdminSectionCode(section.code))
  return sortSectionRows(rows)
}

export async function createSection({ code, label }) {
  const normalizedCode = String(code).trim().toLowerCase()
  const normalizedLabel = String(label ?? code).trim()
  const { data, error } = await supabase
    .from('sections')
    .insert({
      code: normalizedCode,
      label: normalizedLabel || normalizedCode,
      is_active: true,
    })
    .select('id, code, label, is_active')
    .single()
  if (error) throw error
  return data
}

export async function deactivateSection(sectionId) {
  const normalizedId = String(sectionId ?? '').trim()
  if (!normalizedId) {
    throw new Error('Cannot deactivate section: missing database ID.')
  }

  const { data, error } = await supabase.rpc('deactivate_section', {
    p_section_id: normalizedId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function fetchAllCourses(includeInactive = false) {
  let query = supabase
    .from('courses')
    .select('id, code, name, category, school_id, is_active')
    .order('code')
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createCourse({ code, name, category, schoolId }) {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      category: COURSE_CATEGORY_MAP[category] ?? category ?? 'core',
      school_id: schoolId,
    })
    .select('id, code, name, category, school_id, is_active')
    .single()
  if (error) throw error
  return data
}

export async function deactivateCourse(courseId) {
  return deactivateCatalogRow('courses', courseId, 'Course')
}

export async function updateCourseCategory(courseId, category) {
  const { error } = await supabase
    .from('courses')
    .update({
      category: COURSE_CATEGORY_MAP[category] ?? category ?? 'core',
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
  if (error) throw error
}

export async function fetchAllRooms(includeInactive = false) {
  let query = supabase
    .from('rooms')
    .select('id, code, name, is_active')
    .order('code')
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createRoom(code, name) {
  const roomCode = String(code).trim()
  const { data, error } = await supabase
    .from('rooms')
    .insert({ code: roomCode, name: name || roomCode })
    .select('id, code, name, is_active')
    .single()
  if (error) throw error
  return data
}

export async function updateRoom(roomId, { code, name }) {
  const { data, error } = await supabase
    .from('rooms')
    .update({
      code: String(code).trim(),
      name: String(name).trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select('id, code, name, is_active')
    .single()
  if (error) throw error
  return data
}

export async function deactivateRoom(roomId) {
  const normalizedId = String(roomId ?? '').trim()
  if (!normalizedId) {
    throw new Error('Cannot deactivate room: missing database ID.')
  }

  const { data, error } = await supabase.rpc('deactivate_room', {
    p_room_id: normalizedId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function countEntriesForRoom(roomId) {
  const { count, error } = await supabase
    .from('timetable_entries')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
  if (error) throw error
  return count ?? 0
}

export async function fetchTimeSlotsForDay(dayOfWeek) {
  const { data, error } = await supabase
    .from('time_slots')
    .select('id, day_of_week, start_time, end_time, period_number, label')
    .eq('day_of_week', dayOfWeek)
    .order('start_time')
  if (error) throw error
  return data ?? []
}

export async function createTimeSlot({ dayOfWeek, startTime, endTime }) {
  const { data: existing, error: existingError } = await supabase
    .from('time_slots')
    .select('period_number')
    .eq('day_of_week', dayOfWeek)
    .order('period_number', { ascending: false })
    .limit(1)
  if (existingError) throw existingError

  const nextPeriod = (existing?.[0]?.period_number ?? 0) + 1

  const { data, error } = await supabase
    .from('time_slots')
    .insert({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      period_number: nextPeriod,
      label: `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`,
    })
    .select('id, day_of_week, start_time, end_time, period_number, label')
    .single()
  if (error) throw error
  return data
}

export async function updateTimeSlot(timeSlotId, { startTime, endTime }) {
  const { data, error } = await supabase
    .from('time_slots')
    .update({
      start_time: startTime,
      end_time: endTime,
      label: `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`,
    })
    .eq('id', timeSlotId)
    .select('id, day_of_week, start_time, end_time, period_number, label')
    .single()
  if (error) throw error
  return data
}

export async function deleteTimeSlot(timeSlotId) {
  const { error } = await supabase.from('time_slots').delete().eq('id', timeSlotId)
  if (error) throw error
}

export async function countEntriesForTimeSlot(timeSlotId) {
  const { count, error } = await supabase
    .from('timetable_entries')
    .select('id', { count: 'exact', head: true })
    .eq('time_slot_id', timeSlotId)
  if (error) throw error
  return count ?? 0
}

export async function fetchActiveAcademicTerm() {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('id, academic_year_code, semester_code, label')
    .eq('is_active', true)
    .order('academic_year_code', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export { COURSE_CATEGORY_LABELS }
