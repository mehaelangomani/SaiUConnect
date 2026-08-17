import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ROLES, getDashboardPathForRole } from './roles'
import { isAcademicSetupComplete } from './studentSetup'
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen'

/**
 * Guards the student academic setup page.
 * Only authenticated students with incomplete setup may access it.
 */
function StudentSetupRoute({ children }) {
  const {
    isInitializing,
    isProfileLoading,
    isAuthenticated,
    hasValidProfile,
    profile,
    profileError,
  } = useAuth()

  if (isInitializing || isProfileLoading) {
    return <AuthLoadingScreen message="Loading your profile…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (profileError || !hasValidProfile) {
    return <Navigate to="/auth-error" replace />
  }

  if (profile.role !== ROLES.STUDENT) {
    return <Navigate to={getDashboardPathForRole(profile.role)} replace />
  }

  if (isAcademicSetupComplete(profile)) {
    return <Navigate to="/student" replace />
  }

  return children
}

export default StudentSetupRoute
