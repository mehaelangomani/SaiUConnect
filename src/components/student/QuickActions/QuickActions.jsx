import './QuickActions.css'

const ACTIONS = [
  { id: 'timetable', label: 'Timetable', description: 'Your weekly schedule', icon: '▦' },
  { id: 'free-classrooms', label: 'Free Classrooms', description: 'Find available rooms', icon: '⌂' },
  { id: 'faculty', label: 'Faculty', description: 'Search faculty directory', icon: '👤' },
  { id: 'courses', label: 'Enrolled Courses', description: 'Your current courses', icon: '📚' },
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
