import { supabase } from './supabase'
import {
  createCourse,
  createFacultyMember,
  createRoom,
  createSchool,
  createSection,
  fetchAllCourses,
  fetchAllFaculty,
  fetchAllRooms,
  fetchAllSchools,
  fetchAllSections,
} from './adminCatalogService'

export const INITIAL_SCHOOL_CODES = ['SCDS', 'SOL', 'SAS', 'SOAI', 'SOB', 'SOT', 'SOM', 'SAHS']

export const INITIAL_ROOM_CODES = [
  'AB1 Ai Lab',
  'AB1 Mootcourt',
  'AB1 Computer Lab',
  'AB1 101',
  'AB1 102',
  'AB1 103',
  'AB1 104',
  'AB1 201',
  'AB2 101',
  'AB2 202',
  'AB2 203',
  'AB2 204',
  'AB2 205',
  'AB2 206',
  'AB2 207',
  'AB2 208',
  'AB2 209',
  'AB2 210',
  'AB2 211',
  'AB2 212',
]

const DUMMY_FACULTY = [
  {
    name: 'Dr. Dummy Alpha',
    email: 'dummy.alpha@test.saiuconnect.invalid',
  },
  {
    name: 'Dr. Dummy Beta',
    email: 'dummy.beta@test.saiuconnect.invalid',
  },
  {
    name: 'Dr. Dummy Gamma',
    email: 'dummy.gamma@test.saiuconnect.invalid',
  },
  {
    name: 'Dr. Dummy Delta',
    email: 'dummy.delta@test.saiuconnect.invalid',
  },
  {
    name: 'Dr. Dummy Epsilon',
    email: 'dummy.epsilon@test.saiuconnect.invalid',
  },
  {
    name: 'Dr. Dummy Jane',
    email: 'dummy.jane@test.saiuconnect.invalid',
  },
]

const DUMMY_COURSES = [
  { code: 'CS201', name: 'Data Structures', category: 'core' },
  { code: 'CS202', name: 'Programming in Python', category: 'core' },
  { code: 'CS203', name: 'Database Management Systems', category: 'core' },
  { code: 'CS204', name: 'Data Structures Lab', category: 'lab' },
  { code: 'CY301', name: 'Cyber Security', category: 'elective' },
  { code: 'ML301', name: 'Machine Learning', category: 'elective' },
  { code: 'ECO301', name: 'Economics for Computing', category: 'minor' },
]

const INITIAL_SECTIONS = [
  { code: '1', label: '1' },
  { code: '2', label: '2' },
  { code: '3', label: '3' },
  { code: '4', label: '4' },
  { code: '5', label: '5' },
  { code: '6', label: '6' },
  { code: '7', label: '7' },
  { code: 'none', label: 'None' },
]

const UNIQUE_VIOLATION = '23505'

let bootstrapPromise = null

function isUniqueViolation(error) {
  return String(error?.code ?? '') === UNIQUE_VIOLATION
}

async function ensureSchools() {
  const existing = await fetchAllSchools(true)
  const existingCodes = new Set(existing.map((school) => school.code.toUpperCase()))

  for (const code of INITIAL_SCHOOL_CODES) {
    if (!existingCodes.has(code)) {
      await createSchool(code, code)
    }
  }
}

async function ensureRooms() {
  const existing = await fetchAllRooms(true)
  const existingCodes = new Set(existing.map((room) => room.code.toLowerCase()))

  for (const code of INITIAL_ROOM_CODES) {
    if (!existingCodes.has(code.toLowerCase())) {
      await createRoom(code, code)
    }
  }
}

async function ensureFaculty() {
  const existing = await fetchAllFaculty(true)
  const existingEmails = new Set(
    existing.map((member) => String(member.email ?? '').trim().toLowerCase()),
  )

  for (const member of DUMMY_FACULTY) {
    if (existingEmails.has(member.email)) {
      continue
    }

    try {
      await createFacultyMember({
        name: member.name,
        email: member.email,
      })
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error
      }
    }
  }
}

async function ensureSections() {
  const existing = await fetchAllSections(true)
  const existingCodes = new Set(existing.map((section) => section.code.toLowerCase()))

  for (const section of INITIAL_SECTIONS) {
    if (!existingCodes.has(section.code.toLowerCase())) {
      await createSection(section)
    }
  }
}

async function ensureScdsCourses(schools) {
  const scds = schools.find((school) => school.code === 'SCDS')
  if (!scds) {
    return
  }

  const existing = await fetchAllCourses(true)
  const existingCodes = new Set(
    existing
      .filter((course) => course.school_id === scds.id)
      .map((course) => String(course.code ?? '').toUpperCase()),
  )

  for (const course of DUMMY_COURSES) {
    if (existingCodes.has(course.code)) {
      continue
    }

    try {
      await createCourse({
        code: course.code,
        name: course.name,
        category: course.category,
        schoolId: scds.id,
      })
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error
      }
    }
  }
}

async function ensureDummyTimetable() {
  const { error } = await supabase.rpc('ensure_dummy_timetable_bootstrap')

  if (error) {
    throw error
  }
}

export async function ensureCatalogBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureSchools()
      await ensureRooms()
      await ensureSections()
      await ensureFaculty()

      const schools = await fetchAllSchools()
      await ensureScdsCourses(schools)
      await ensureDummyTimetable()
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }

  return bootstrapPromise
}
