import { supabase } from './supabase'
import { isFacultyFormatEmail, isStudentFormatEmail } from '../auth/loginRules'

/**
 * Asks the trusted Edge Function to create a Student/Faculty Auth user if missing.
 * Sends only the email. Does not send or store passwords.
 */
export async function provisionUniversityAccountIfNeeded(email) {
  if (!isStudentFormatEmail(email) && !isFacultyFormatEmail(email)) {
    return
  }

  await supabase.functions.invoke('provision-university-user', {
    body: { email },
  })
}
