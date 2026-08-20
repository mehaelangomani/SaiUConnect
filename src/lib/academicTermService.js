import { supabase } from './supabase'

/**
 * The current Admin timetable term: one active academic_terms row.
 * Same rule as the Admin editor. Students must use this, not profile year/semester.
 */
export async function fetchActiveAcademicTerm() {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('id, academic_year_code, semester_code, label')
    .eq('is_active', true)
    .order('academic_year_code', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
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
