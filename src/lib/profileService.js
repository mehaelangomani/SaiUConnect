import { supabase } from './supabase'

/**
 * Fetch the authenticated user's profile from the database.
 * Role is always resolved from the profile — never from the login form.
 */
export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, email, name')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
