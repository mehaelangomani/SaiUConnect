import { useAuth } from '../../auth/AuthContext'
import './AuthLoadingScreen.css'

function AuthLoadingScreen({ message = 'Loading…' }) {
  const { isInitializing } = useAuth()

  if (!isInitializing) {
    return null
  }

  return (
    <div className="auth-loading-screen" role="status" aria-live="polite">
      <div className="auth-loading-screen__content">
        <span className="suc-spinner suc-spinner--dark suc-spinner--lg" aria-hidden="true" />
        <p className="auth-loading-screen__message">{message}</p>
      </div>
    </div>
  )
}

export default AuthLoadingScreen
