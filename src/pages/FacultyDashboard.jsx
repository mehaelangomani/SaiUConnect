import DashboardLayout from '../components/layout/DashboardLayout'
import { ROLES } from '../auth/roles'

function FacultyDashboard() {
  return (
    <DashboardLayout
      title="Faculty Dashboard"
      description="Your teaching schedule and classroom tools will appear here."
    >
      <div className="suc-card suc-card--flat">
        <div className="suc-card__body">
          <span className="suc-badge suc-badge--primary">{ROLES.FACULTY}</span>
          <p style={{ marginTop: 'var(--suc-space-4)', color: 'var(--suc-color-text-muted)' }}>
            Faculty scheduling features are coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default FacultyDashboard
