import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import ConfirmationDialog from '../common/ConfirmationDialog/ConfirmationDialog'
import { stopBeingEditor } from '../../lib/adminRoleService'
import { useState } from 'react'
import './TimetableProfilePanels.css'

function EditorProfilePanel() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(null)

  const handleStopBeingEditor = async () => {
    try {
      await stopBeingEditor(profile.id)
      setShowConfirm(false)
      await signOut()
      navigate('/login', { replace: true })
    } catch (stopError) {
      setError(stopError)
      setShowConfirm(false)
    }
  }

  return (
    <div className="timetable-profile">
      <header className="timetable-profile__header">
        <button type="button" className="suc-btn suc-btn--ghost suc-btn--sm" onClick={() => navigate('/editor')}>
          ← Back to timetable
        </button>
        <h1 className="timetable-profile__title">Editor Profile</h1>
      </header>

      {error && (
        <div className="suc-alert suc-alert--error" role="alert">
          <p>{error.message}</p>
        </div>
      )}

      <section className="timetable-profile__section suc-card">
        <h2>Name</h2>
        <p>{profile?.name || '—'}</p>
      </section>

      <section className="timetable-profile__section suc-card">
        <h2>Email</h2>
        <p>{profile?.email}</p>
      </section>

      <section className="timetable-profile__section suc-card">
        <button type="button" className="suc-btn suc-btn--secondary" onClick={() => setShowConfirm(true)}>
          Stop Being Editor
        </button>
      </section>

      <section className="timetable-profile__section">
        <button type="button" className="suc-btn suc-btn--ghost" onClick={() => signOut()}>
          Logout
        </button>
      </section>

      <ConfirmationDialog
        isOpen={showConfirm}
        title="Stop being editor?"
        message="Your role will change to faculty and you will be signed out."
        confirmLabel="Confirm"
        onConfirm={handleStopBeingEditor}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}

export default EditorProfilePanel
