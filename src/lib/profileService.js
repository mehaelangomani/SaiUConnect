import { supabase } from './supabase'

const PROFILE_FIELDS = [
  'id',
  'role',
  'email',
  'name',
  'prn',
  'school',
  'graduation_year',
  'initial',
  'academic_year',
  'semester',
  'minor',
  'electives',
  'section',
  'lab_group',
  'academic_setup_completed',
].join(', ')

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('fetchUserProfile error:', error)
    throw error
  }

  return data
}

export async function saveAcademicSetup(userId, setupData) {
  const updatePayload = {
    prn: String(setupData.prn ?? '').trim(),
    academic_year: setupData.academicYear,
    minor: setupData.minor,
    electives: setupData.electives,
    section: setupData.section,
    lab_group: setupData.labGroup,
    academic_setup_completed: true,
  }

  console.log('saveAcademicSetup payload:', updatePayload)

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single()

  if (error) {
    console.error('saveAcademicSetup SUPABASE ERROR:', error)
    console.error('code:', error.code)
    console.error('message:', error.message)
    console.error('details:', error.details)
    console.error('hint:', error.hint)

    throw new Error(
      `[${error.code ?? 'UNKNOWN'}] ${error.message}${
        error.details ? ` | ${error.details}` : ''
      }${
        error.hint ? ` | Hint: ${error.hint}` : ''
      }`,
    )
  }

  return data
}

export async function updateAcademicSetup(userId, setupData) {
  const updatePayload = {
    academic_year: setupData.academicYear,
    minor: setupData.minor,
    electives: setupData.electives,
    section: setupData.section,
    lab_group: setupData.labGroup,
    academic_setup_completed: true,
  }

  console.log('updateAcademicSetup payload:', updatePayload)

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single()

  if (error) {
    console.error('updateAcademicSetup SUPABASE ERROR:', error)
    console.error('code:', error.code)
    console.error('message:', error.message)
    console.error('details:', error.details)
    console.error('hint:', error.hint)

    throw new Error(
      `[${error.code ?? 'UNKNOWN'}] ${error.message}${
        error.details ? ` | ${error.details}` : ''
      }${
        error.hint ? ` | Hint: ${error.hint}` : ''
      }`,
    )
  }

  return data
}