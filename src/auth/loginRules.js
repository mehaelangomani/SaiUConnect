/**
 * Login email rules for SaiUConnect.
 * Admin uses a predefined email (from env) and bypasses Student/Faculty format validation.
 * Passwords are never stored here — Supabase Auth handles credentials.
 * Role is never inferred from email format; profiles.role remains the source of truth.
 */

const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase()
const STUDENT_EMAIL_DOMAIN = String(
  import.meta.env.VITE_STUDENT_EMAIL_DOMAIN ?? '@saiuniversity.edu.in',
).trim().toLowerCase()
const UNIVERSITY_DOMAIN = STUDENT_EMAIL_DOMAIN.replace(/^@/, '')
const UNIVERSITY_DOMAIN_PATTERN = UNIVERSITY_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const STUDENT_EMAIL_PATTERN = new RegExp(`^[a-z]+\\.[a-z]-\\d{2}@([a-z0-9]+)\\.${UNIVERSITY_DOMAIN_PATTERN}$`)
const FACULTY_EMAIL_PATTERN = new RegExp(`^[a-z]+\\.[a-z]@${UNIVERSITY_DOMAIN_PATTERN}$`)
const APEX_UNIVERSITY_EMAIL_PATTERN = new RegExp(`^[^@\\s]+@${UNIVERSITY_DOMAIN_PATTERN}$`)
const APEX_STUDENT_YEAR_PATTERN = new RegExp(`-\\d{2}@${UNIVERSITY_DOMAIN_PATTERN}$`)

const INVALID_FORMAT_MESSAGE = 'Enter a valid Sai University Student or Faculty email.'

const KNOWN_SCHOOL_CODES = new Set(['SCDS', 'SOL', 'SAS', 'SOAI', 'SOB', 'SOT', 'SOM', 'SAHS'])

export function isPredefinedAdminEmail(email) {
  if (!ADMIN_EMAIL) {
    return false
  }

  return String(email ?? '').trim().toLowerCase() === ADMIN_EMAIL
}

export function isStudentFormatEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  const match = normalized.match(STUDENT_EMAIL_PATTERN)
  if (!match) {
    return false
  }
  return KNOWN_SCHOOL_CODES.has(match[1].toUpperCase())
}

export function isFacultyFormatEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  return FACULTY_EMAIL_PATTERN.test(normalized)
}

export function isStudentDomainEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  return isStudentFormatEmail(normalized) || isFacultyFormatEmail(normalized)
}

/**
 * Existing Editor (and other staff) accounts may use a university apex mailbox
 * that is neither Student-shaped nor Faculty-shaped. This does not assign a role.
 * Addresses that look like Faculty-plus-year (name.x-29@saiuniversity.edu.in) are rejected.
 */
function isCompatibleUniversityApexEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!APEX_UNIVERSITY_EMAIL_PATTERN.test(normalized)) {
    return false
  }
  if (APEX_STUDENT_YEAR_PATTERN.test(normalized)) {
    return false
  }
  return true
}

/**
 * Validate email before sign-in attempt.
 * Admin email bypasses Student/Faculty format validation.
 */
export function validateLoginEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()

  if (!normalized) {
    return { valid: false, message: 'Please enter your email.' }
  }

  if (isPredefinedAdminEmail(normalized)) {
    return { valid: true }
  }

  if (isStudentFormatEmail(normalized) || isFacultyFormatEmail(normalized)) {
    return { valid: true }
  }

  if (isCompatibleUniversityApexEmail(normalized)) {
    return { valid: true }
  }

  return {
    valid: false,
    message: INVALID_FORMAT_MESSAGE,
  }
}
