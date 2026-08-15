/**
 * TEMPORARY — remove this file when Supabase connectivity is verified.
 * Safely checks that the Supabase client can reach the project API.
 */

function safeErrorMessage(error) {
  if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
    return error.message
  }

  return 'Supabase connection failed. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
}

export async function testSupabaseConnection() {
  try {
    const { supabase } = await import('./supabase.js')
    const { error } = await supabase.auth.getSession()

    if (error) {
      return { ok: false, message: safeErrorMessage(error) }
    }

    return { ok: true, message: 'Supabase connection initialized' }
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error) }
  }
}
