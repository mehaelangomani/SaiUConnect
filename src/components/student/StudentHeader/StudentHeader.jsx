import { useAuth } from '../../../auth/AuthContext'
import SaiUniversityMark from '../../SaiUniversityMark/SaiUniversityMark'
import AppNavigation from '../../common/AppNavigation/AppNavigation'
import './StudentHeader.css'

function StudentHeader({ onMenuToggle, showMenuButton }) {
  const { profile, signOut } = useAuth()

  const displayName = profile?.name || profile?.email || 'Student'
  const initial = profile?.initial || displayName.charAt(0).toUpperCase()

  return (
    <header className="student-header suc-header">
      <div className="student-header__left">
        {showMenuButton && (
          <button
            type="button"
            className="student-header__menu-btn"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden="true">☰</span>
          </button>
        )}

        <div className="student-header__brand">
          <SaiUniversityMark className="student-header__logo" />
          <div>
            <span className="student-header__brand-name">SaiUConnect</span>
            <span className="student-header__brand-sub">Sai University</span>
          </div>
        </div>
      </div>

      <div className="student-header__actions">
        <AppNavigation />
        <div className="student-header__profile">
          <span className="student-header__avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="student-header__profile-text">
            <span className="student-header__name">{displayName}</span>
            <span className="student-header__role">Student</span>
          </div>
        </div>

        <button
          type="button"
          className="suc-btn suc-btn--ghost suc-btn--sm"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default StudentHeader
