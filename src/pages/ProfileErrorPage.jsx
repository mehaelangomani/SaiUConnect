import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PROFILE_ERROR_MESSAGES } from '../auth/profileErrors'
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen'
import PageBackground from '../components/PageBackground/PageBackground'
import './ProfileErrorPage.css'

function ProfileErrorPage() {
  const { isInitializing, isAuthenticated, profileError, signOut } = useAuth()

  if (isInitializing) {
    return <AuthLoadingScreen message="Loading…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const message =
    PROFILE_ERROR_MESSAGES[profileError] ??
    'An authentication error occurred. Please contact an administrator.'

  return (
    <PageBackground variant="dashboard" watermarkVariant="corner">
      <main className="profile-error-page">
        <div className="profile-error-page__card suc-card suc-card--elevated">
          <h1 className="profile-error-page__title">Account setup issue</h1>
          <p className="profile-error-page__message suc-alert suc-alert--error" role="alert">
            {message}
          </p>
          <button
            type="button"
            className="suc-btn suc-btn--secondary"
            onClick={() => signOut()}
          >
            Return to login
          </button>
        </div>
      </main>
    </PageBackground>
  )
}

export default ProfileErrorPage
