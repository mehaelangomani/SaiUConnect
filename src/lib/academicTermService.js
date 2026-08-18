import { supabase } from './supabase'

/**
 * Resolve the student's academic term from profile codes.
 */
export async function resolveAcademicTerm(profile) {
  const academicYear = String(profile?.academic_year ?? '').trim()
  const semester = String(profile?.semester ?? '').trim()

  if (!academicYear || !semester) {
    return null
  }

  const { data, error } = await supabase
    .from('academic_terms')
    .select('id, academic_year_code, semester_code, label')
    .eq('academic_year_code', academicYear)
    .eq('semester_code', semester)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    console.error('[SaiUConnect] Academic term lookup returned no match', {
      academic_year: academicYear,
      semester,
      school: String(profile?.school ?? '').trim(),
    })
  }

  return data
}

/**
 * Resolve school id from profile school code.
 */
export async function resolveSchool(profile) {
  const schoolCode = String(profile?.school ?? '').trim()

  if (!schoolCode) {
    return null
  }

  const { data, error } = await supabase
    .from('schools')
    .select('id, code, name')
    .eq('code', schoolCode)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    console.error('[SaiUConnect] School lookup returned no match', {
      school: schoolCode,
      academic_year: String(profile?.academic_year ?? '').trim(),
      semester: String(profile?.semester ?? '').trim(),
    })
  }

  return data
}
