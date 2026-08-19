/**
 * Login email rules for SaiUConnect.
 * Admin uses a predefined email (from env) and bypasses student domain validation.
 * Passwords are never stored here — Supabase Auth handles credentials.
 */

const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase()
const STUDENT_EMAIL_DOMAIN = String(
  import.meta.env.VITE_STUDENT_EMAIL_DOMAIN ?? '@saiuniversity.edu.in',
).trim().toLowerCase()

export function isPredefinedAdminEmail(email) {
  if (!ADMIN_EMAIL) {
    return false
  }

  return String(email ?? '').trim().toLowerCase() === ADMIN_EMAIL
}

export function isStudentDomainEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  return normalized.endsWith(STUDENT_EMAIL_DOMAIN)
}

/**
 * Validate email before sign-in attempt.
 * Admin email bypasses university domain requirement.
 */
export function validateLoginEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()

  if (!normalized) {
    return { valid: false, message: 'Please enter your email.' }
  }

  if (isPredefinedAdminEmail(normalized)) {
    return { valid: true }
  }

  if (!isStudentDomainEmail(normalized)) {
    return {
      valid: false,
      message: `Please use your Sai University email (${STUDENT_EMAIL_DOMAIN}).`,
    }
  }

  return { valid: true }
}
