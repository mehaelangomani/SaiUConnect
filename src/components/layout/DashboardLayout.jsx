import { useAuth } from '../../auth/AuthContext'
import PageBackground from '../PageBackground/PageBackground'
import AppNavigation from '../common/AppNavigation/AppNavigation'
import './DashboardLayout.css'

function DashboardLayout({ title, description, children }) {
  const { profile, signOut } = useAuth()

  const displayName = profile?.name || profile?.email || 'User'

  return (
    <PageBackground variant="dashboard" watermarkVariant="corner">
      <div className="dashboard-layout">
        <header className="suc-header dashboard-layout__header">
          <div className="dashboard-layout__brand">
            <span className="dashboard-layout__brand-name">SaiUConnect</span>
            <span className="dashboard-layout__brand-role">{title}</span>
          </div>

          <div className="suc-header__actions">
            <AppNavigation />
            <span className="dashboard-layout__user">{displayName}</span>
            <button
              type="button"
              className="suc-btn suc-btn--ghost suc-btn--sm"
              onClick={() => signOut()}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-layout__main">
          <div className="dashboard-layout__content">
            <div className="dashboard-layout__intro suc-card">
              <h1 className="dashboard-layout__title">{title}</h1>
              <p className="dashboard-layout__description">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </PageBackground>
  )
}

export default DashboardLayout
