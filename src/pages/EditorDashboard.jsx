import DashboardLayout from '../components/layout/DashboardLayout'
import { ROLES } from '../auth/roles'

function EditorDashboard() {
  return (
    <DashboardLayout
      title="Editor Dashboard"
      description="Timetable editing tools will appear here."
    >
      <div className="suc-card suc-card--flat">
        <div className="suc-card__body">
          <span className="suc-badge suc-badge--primary">{ROLES.EDITOR}</span>
          <p style={{ marginTop: 'var(--suc-space-4)', color: 'var(--suc-color-text-muted)' }}>
            Timetable editing features are coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EditorDashboard
