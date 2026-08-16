import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDashboardPathForRole } from './roles'
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen'

function RootRedirect() {
  const {
    isInitializing,
    isProfileLoading,
    isAuthenticated,
    hasValidProfile,
    profile,
    profileError,
  } = useAuth()

  if (isInitializing || (isAuthenticated && isProfileLoading)) {
    return <AuthLoadingScreen message="Loading…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (profileError || !hasValidProfile) {
    return <Navigate to="/auth-error" replace />
  }

  return <Navigate to={getDashboardPathForRole(profile.role)} replace />
}

export default RootRedirect
