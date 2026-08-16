import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getDashboardPathForRole } from './roles'
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen'

function PublicRoute({ children }) {
  const { isInitializing, isProfileLoading, isAuthenticated, hasValidProfile, profile, profileError } =
    useAuth()

  if (isInitializing) {
    return <AuthLoadingScreen message="Restoring session…" />
  }

  if (isAuthenticated && isProfileLoading) {
    return <AuthLoadingScreen message="Loading your profile…" />
  }

  if (isAuthenticated && profileError) {
    return <Navigate to="/auth-error" replace />
  }

  if (isAuthenticated && hasValidProfile) {
    return <Navigate to={getDashboardPathForRole(profile.role)} replace />
  }

  return children
}

export default PublicRoute
