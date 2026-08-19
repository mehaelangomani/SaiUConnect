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
    department: 'Computer Science',
  },
  {
    name: 'Dr. Dummy Beta',
    email: 'dummy.beta@test.saiuconnect.invalid',
    department: 'Computer Science',
  },
  {
    name: 'Dr. Dummy Gamma',
    email: 'dummy.gamma@test.saiuconnect.invalid',
    department: 'Computer Science',
  },
]

const DUMMY_COURSES = [
  { code: 'CS201', name: 'Data Structures', category: 'core' },
  { code: 'CS202', name: 'Programming in Python', category: 'core' },
  { code: 'CS203', name: 'Database Management Systems', category: 'core' },
  { code: 'CY301', name: 'Cyber Security', category: 'elective' },
  { code: 'ML301', name: 'Machine Learning', category: 'elective' },
  { code: 'CS204', name: 'Data Structures Lab', category: 'lab' },
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

let bootstrapPromise = null

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

async function ensureFaculty(schoolId) {
  const existing = await fetchAllFaculty(true)
  if (existing.length > 0) {
    return
  }

  for (const member of DUMMY_FACULTY) {
    await createFacultyMember({
      name: member.name,
      email: member.email,
      schoolId,
      department: member.department,
    })
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

async function ensureCoursesForSchools(schools) {
  const existing = await fetchAllCourses(true)
  const schoolsToSeed = schools.filter((school) => INITIAL_SCHOOL_CODES.includes(school.code))

  for (const school of schoolsToSeed) {
    const hasCoursesForSchool = existing.some((course) => course.school_id === school.id)
    if (hasCoursesForSchool) {
      continue
    }

    for (const course of DUMMY_COURSES) {
      await createCourse({
        code: course.code,
        name: course.name,
        category: course.category,
        schoolId: school.id,
      })
    }
  }
}

export async function ensureCatalogBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureSchools()
      await ensureRooms()
      await ensureSections()

      const schools = await fetchAllSchools()
      const primarySchool =
        schools.find((school) => school.code === 'SCDS') ??
        schools.find((school) => INITIAL_SCHOOL_CODES.includes(school.code)) ??
        schools[0]

      if (primarySchool?.id) {
        await ensureFaculty(primarySchool.id)
      }

      await ensureCoursesForSchools(schools)
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }

  return bootstrapPromise
}
