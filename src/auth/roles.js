export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  EDITOR: 'editor',
  ADMIN: 'admin',
}

export const ROLE_LIST = Object.values(ROLES)

const ROLE_DASHBOARD_PATHS = {
  [ROLES.STUDENT]: '/student',
  [ROLES.FACULTY]: '/faculty',
  [ROLES.EDITOR]: '/editor',
  [ROLES.ADMIN]: '/admin',
}

export function isValidRole(role) {
  return ROLE_LIST.includes(role)
}

export function getDashboardPathForRole(role) {
  return ROLE_DASHBOARD_PATHS[role] ?? null
}
