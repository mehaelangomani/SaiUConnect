import { STUDENT_NAV_ITEMS } from '../studentNav'
import './StudentSidebar.css'

function StudentSidebar({ activeSection, onNavigate, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="student-sidebar__backdrop"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`student-sidebar ${isOpen ? 'student-sidebar--open' : ''}`}
        aria-label="Student navigation"
      >
        <nav className="student-sidebar__nav">
          {STUDENT_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`student-sidebar__link ${
                activeSection === item.id ? 'student-sidebar__link--active' : ''
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="student-sidebar__icon" aria-hidden="true">
                {getNavIcon(item.icon)}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

function getNavIcon(icon) {
  const icons = {
    dashboard: '▣',
    timetable: '▦',
    classroom: '⌂',
    faculty: '👤',
    courses: '📚',
    profile: '◎',
    notifications: '🔔',
  }
  return icons[icon] ?? '•'
}

export default StudentSidebar
