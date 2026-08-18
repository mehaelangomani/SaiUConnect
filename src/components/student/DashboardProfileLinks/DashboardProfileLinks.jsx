import './DashboardProfileLinks.css'

function DashboardProfileLinks({ onNavigate }) {
  return (
    <nav className="dashboard-profile-links" aria-label="Profile shortcuts">
      <button
        type="button"
        className="dashboard-profile-links__btn suc-btn suc-btn--ghost"
        onClick={() => onNavigate('profile')}
      >
        View Profile
      </button>
      <button
        type="button"
        className="dashboard-profile-links__btn suc-btn suc-btn--secondary"
        onClick={() => onNavigate('academic-setup')}
      >
        Edit Academic Setup
      </button>
    </nav>
  )
}

export default DashboardProfileLinks
