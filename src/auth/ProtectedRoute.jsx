import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getDashboardPathForRole } from './roles'
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen'

function ProtectedRoute({ children, allowedRoles }) {
  const {
    isInitializing,
    isProfileLoading,
    isAuthenticated,
    hasValidProfile,
    profile,
    profileError,
  } = useAuth()

  if (isInitializing) {
    return <AuthLoadingScreen message="Restoring session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isProfileLoading) {
    return <AuthLoadingScreen message="Loading your profile…" />
  }

  if (profileError) {
    return <Navigate to="/auth-error" replace />
  }

  if (!hasValidProfile) {
    return <Navigate to="/auth-error" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getDashboardPathForRole(profile.role)} replace />
  }

  return children
}

export default ProtectedRoute
