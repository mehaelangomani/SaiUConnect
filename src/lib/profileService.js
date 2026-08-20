import { supabase } from './supabase'

const PROFILE_FIELDS = [
  'id',
  'role',
  'email',
  'name',
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

/**
 * Fetch the authenticated user's profile from the database.
 * Role is always resolved from the profile — never from the login form.
 */
export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * Persist a student's academic setup selections to their profile.
 * Sets academic_setup_completed to true on success.
 */
export async function saveAcademicSetup(userId, setupData) {
  return updateAcademicSetup(userId, setupData)
}

/**
 * Update an existing student's academic configuration.
 * Keeps academic_setup_completed true after a successful edit.
 */
export async function updateAcademicSetup(userId, setupData) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      academic_year: setupData.academicYear,
      minor: setupData.minor,
      electives: setupData.electives,
      section: setupData.section,
      lab_group: setupData.labGroup,
      academic_setup_completed: true,
    })
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single()

  if (error) {
    throw error
  }

  return data
}
