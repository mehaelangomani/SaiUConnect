import './QuickActions.css'

const ACTIONS = [
  { id: 'timetable', label: 'View Timetable', description: 'See your weekly schedule', icon: '▦' },
  { id: 'free-classrooms', label: 'Find Free Classroom', description: 'Check room availability', icon: '⌂' },
  { id: 'faculty', label: 'Find Faculty', description: 'Browse faculty contacts', icon: '👤' },
  { id: 'courses', label: 'View Courses', description: 'Your enrolled courses', icon: '📚' },
]

function QuickActions({ onNavigate }) {
  return (
    <section className="quick-actions" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="quick-actions__title">
        Quick Actions
      </h2>

      <div className="quick-actions__grid">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            className="quick-actions__card suc-card"
            onClick={() => onNavigate(action.id)}
          >
            <span className="quick-actions__icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="quick-actions__label">{action.label}</span>
            <span className="quick-actions__description">{action.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickActions
