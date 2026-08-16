import DashboardLayout from '../components/layout/DashboardLayout'
import { ROLES } from '../auth/roles'

function StudentDashboard() {
  return (
    <DashboardLayout
      title="Student Dashboard"
      description="Your personalized timetable and classroom availability will appear here."
    >
      <div className="suc-card suc-card--flat">
        <div className="suc-card__body">
          <span className="suc-badge suc-badge--primary">{ROLES.STUDENT}</span>
          <p style={{ marginTop: 'var(--suc-space-4)', color: 'var(--suc-color-text-muted)' }}>
            Timetable and availability features are coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
