import { ROLES, getDashboardPathForRole } from './roles'

export const STUDENT_SETUP_PATH = '/student/setup'
export const STUDENT_DASHBOARD_PATH = '/student'

export function isStudent(profile) {
  return profile?.role === ROLES.STUDENT
}

export function isAcademicSetupComplete(profile) {
  return Boolean(profile?.academic_setup_completed)
}

/**
 * Resolves where an authenticated user should land after login or root redirect.
 * Students with incomplete setup go to /student/setup; everyone else to their role dashboard.
 */
export function getPostLoginPath(profile) {
  if (!profile?.role) {
    return '/login'
  }

  if (isStudent(profile) && !isAcademicSetupComplete(profile)) {
    return STUDENT_SETUP_PATH
  }

  return getDashboardPathForRole(profile.role) ?? '/login'
}
