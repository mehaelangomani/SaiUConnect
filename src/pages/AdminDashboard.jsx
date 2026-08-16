import DashboardLayout from '../components/layout/DashboardLayout'
import { ROLES } from '../auth/roles'

function AdminDashboard() {
  return (
    <DashboardLayout
      title="Admin Dashboard"
      description="Administrative controls and system management will appear here."
    >
      <div className="suc-card suc-card--flat">
        <div className="suc-card__body">
          <span className="suc-badge suc-badge--primary">{ROLES.ADMIN}</span>
          <p style={{ marginTop: 'var(--suc-space-4)', color: 'var(--suc-color-text-muted)' }}>
            Admin management features are coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
