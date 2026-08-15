import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing Supabase environment variables. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    )
  }

  return {
    url: supabaseUrl,
    key: supabasePublishableKey,
  }
}

const { url, key } = getSupabaseConfig()

/**
 * Shared Supabase client for browser-side use.
 * Uses the publishable (anon) key only — never the secret/service role key.
 */
export const supabase = createClient(url, key)

export default supabase
