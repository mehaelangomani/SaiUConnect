import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import ConfirmationDialog from '../common/ConfirmationDialog/ConfirmationDialog'
import {
  deactivateCourse,
  deactivateFacultyMember,
  fetchAllCourses,
  fetchAllFaculty,
  fetchAllSchools,
} from '../../lib/adminCatalogService'
import { appointAdmin, fetchEditors, removeEditorRole } from '../../lib/adminRoleService'
import './TimetableProfilePanels.css'

const COURSE_GROUP_LABELS = {
  core: 'MAJOR COURSES',
  minor: 'MINOR COURSES',
  elective: 'ELECTIVES',
  lab: 'LABS',
}

const PROFILE_MENU_ITEMS = [
  { id: 'faculty', label: 'Faculty List' },
  { id: 'courses', label: 'Course List' },
  { id: 'editors', label: 'Editors' },
  { id: 'appoint', label: 'Appoint New Admin' },
]

function formatCourseListLabel(course, schoolCodeById) {
  const schoolCode = schoolCodeById.get(course.school_id) || '—'
  return `${course.code} — ${course.name} (${schoolCode})`
}

function AdminProfilePanel() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [selectedSection, setSelectedSection] = useState(null)
  const [faculty, setFaculty] = useState([])
  const [courses, setCourses] = useState([])
  const [schools, setSchools] = useState([])
  const [editors, setEditors] = useState([])
  const [appointEmail, setAppointEmail] = useState('')
  const [confirmState, setConfirmState] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [facultyData, courseData, schoolData, editorData] = await Promise.all([
        fetchAllFaculty(),
        fetchAllCourses(),
        fetchAllSchools(),
        fetchEditors(),
      ])
      setFaculty(facultyData)
      setCourses(courseData)
      setSchools(schoolData)
      setEditors(editorData)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const schoolCodeById = new Map(schools.map((school) => [school.id, school.code]))

  const groupedCourses = {
    core: courses.filter((course) => course.category === 'core'),
    minor: courses.filter((course) => course.category === 'minor'),
    elective: courses.filter((course) => course.category === 'elective'),
    lab: courses.filter((course) => course.category === 'lab'),
  }

  const handleAppointAdminFirstStep = () => {
    const trimmed = appointEmail.trim()
    if (!trimmed) {
      setError(new Error('Enter an email address.'))
      return
    }

    setError(null)
    setConfirmState({
      title: 'Appoint new admin',
      message: `Are you sure you want to appoint\n"${trimmed}"\nas the new admin?`,
      confirmLabel: 'DONE',
      cancelLabel: 'CANCEL',
      onConfirm: async () => {
        try {
          await appointAdmin(trimmed, profile.id)
          setConfirmState(null)
          await signOut()
          navigate('/login', { replace: true })
        } catch (appointError) {
          setError(appointError)
          setConfirmState(null)
        }
      },
    })
  }

  const handleBackToMenu = () => {
    setSelectedSection(null)
  }

  const sectionTitle = {
    faculty: 'Faculty List',
    courses: 'Course List',
    editors: 'Editors',
    appoint: 'Appoint New Admin',
  }[selectedSection]

  return (
    <div className="timetable-profile">
      <div className="admin-profile-sticky-back">
        <button
          type="button"
          className="admin-profile-sticky-back__button"
          onClick={() => navigate('/admin')}
          title="Back to timetable"
          aria-label="Back to timetable"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M15.5 19 8.5 12l7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <header className="timetable-profile__header">
        <h1 className="timetable-profile__title">Admin Profile</h1>
      </header>

      {error && (
        <div className="suc-alert suc-alert--error" role="alert">
          <p>{error.message}</p>
        </div>
      )}

      {selectedSection === null ? (
        <nav className="admin-profile-menu suc-card" aria-label="Admin profile">
          <div className="admin-profile-menu__email">
            <h2>Admin Email</h2>
            <p>{profile?.email}</p>
          </div>
          <ul className="admin-profile-menu__list">
            {PROFILE_MENU_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="admin-profile-menu__item"
                  onClick={() => setSelectedSection(item.id)}
                >
                  <span>{item.label}</span>
                  <span className="admin-profile-menu__chevron" aria-hidden="true">
                    &gt;
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="admin-profile-menu__item" onClick={() => signOut()}>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      ) : (
        <section className="timetable-profile__section suc-card">
          <button
            type="button"
            className="suc-btn suc-btn--ghost suc-btn--sm admin-profile-detail__back"
            onClick={handleBackToMenu}
          >
            ← Back
          </button>
          <h2>{sectionTitle}</h2>

          {selectedSection === 'faculty' &&
            (isLoading ? (
              <p>Loading…</p>
            ) : faculty.length === 0 ? (
              <p className="timetable-profile__empty">No faculty found.</p>
            ) : (
              <ul className="timetable-profile__list">
                {faculty.map((member) => (
                  <li key={member.id}>
                    <span>{member.name}</span>
                    <button
                      type="button"
                      className="timetable-profile__delete"
                      onClick={() =>
                        setConfirmState({
                          title: 'Deactivate faculty?',
                          message: `Deactivate ${member.name}?`,
                          confirmLabel: 'Remove',
                          onConfirm: async () => {
                            await deactivateFacultyMember(member.id)
                            setConfirmState(null)
                            await loadData()
                          },
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {selectedSection === 'courses' &&
            Object.entries(groupedCourses).map(([category, items]) => (
              <div key={category} className="timetable-profile__course-group">
                <h3>{COURSE_GROUP_LABELS[category] ?? category}</h3>
                {items.length === 0 ? (
                  <p className="timetable-profile__empty">No courses in this group.</p>
                ) : (
                  <ul className="timetable-profile__list">
                    {items.map((course) => {
                      const courseLabel = formatCourseListLabel(course, schoolCodeById)
                      return (
                      <li key={course.id}>
                        <span>{courseLabel}</span>
                        <button
                          type="button"
                          className="timetable-profile__delete"
                          onClick={() =>
                            setConfirmState({
                              title: 'Deactivate course?',
                              message: `Deactivate ${courseLabel}?`,
                              confirmLabel: 'Remove',
                              onConfirm: async () => {
                                await deactivateCourse(course.id)
                                setConfirmState(null)
                                await loadData()
                              },
                            })
                          }
                        >
                          ×
                        </button>
                      </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}

          {selectedSection === 'editors' &&
            (editors.length === 0 ? (
              <p className="timetable-profile__empty">No editors assigned.</p>
            ) : (
              <ul className="timetable-profile__list">
                {editors.map((editor) => (
                  <li key={editor.id}>
                    <div>
                      <strong>{editor.name || editor.email}</strong>
                      <p>{editor.email}</p>
                    </div>
                    <button
                      type="button"
                      className="timetable-profile__delete"
                      onClick={() =>
                        setConfirmState({
                          title: 'Remove editor access?',
                          message: `Are you sure you want to remove editor access from ${editor.email}?`,
                          confirmLabel: 'Remove',
                          onConfirm: async () => {
                            await removeEditorRole(editor.id)
                            setConfirmState(null)
                            await loadData()
                          },
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {selectedSection === 'appoint' && (
            <div className="timetable-profile__appoint">
              <input
                className="suc-input"
                type="email"
                value={appointEmail}
                onChange={(event) => setAppointEmail(event.target.value)}
                placeholder="newadmin@saiuniversity.edu.in"
              />
              <button type="button" className="suc-btn suc-btn--primary" onClick={handleAppointAdminFirstStep}>
                DONE
              </button>
            </div>
          )}
        </section>
      )}

      <ConfirmationDialog
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        cancelLabel={confirmState?.cancelLabel ?? 'Cancel'}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}

export default AdminProfilePanel
