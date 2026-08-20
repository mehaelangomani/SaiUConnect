import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'
import {
  fetchMyEditorAccessRequest,
  fetchMyNotifications,
  markNotificationRead,
  submitEditorAccessRequest,
} from '../../lib/editorRequestService'
import './FacultyProfileMenu.css'

function FacultyProfileMenu() {
  const navigate = useNavigate()
  const { profile, signOut, refreshProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [request, setRequest] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const menuRef = useRef(null)

  const displayName = profile?.name || profile?.email || 'Faculty'
  const initial = profile?.initial || displayName.charAt(0).toUpperCase()
  const isFaculty = profile?.role === ROLES.FACULTY
  const isEditor = profile?.role === ROLES.EDITOR
  const pendingRequest = request?.status === 'pending'

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isFaculty || !isOpen) {
      return undefined
    }

    let cancelled = false

    async function loadRequestState() {
      try {
        const [latestRequest, notifications] = await Promise.all([
          fetchMyEditorAccessRequest(),
          fetchMyNotifications(),
        ])
        if (cancelled) {
          return
        }
        setRequest(latestRequest)
        const unread = notifications.find((item) => !item.is_read)
        if (unread) {
          setNotice(unread.message)
          await markNotificationRead(unread.id)
          if (unread.notification_type === 'editor_request_approved') {
            await refreshProfile()
            navigate('/editor', { replace: true })
          }
        }
      } catch {
        if (!cancelled) {
          setRequest(null)
        }
      }
    }

    loadRequestState()
    return () => {
      cancelled = true
    }
  }, [isFaculty, isOpen, navigate, refreshProfile])

  const handleRequestEditor = async () => {
    setError('')
    setNotice('')
    setIsSubmitting(true)
    try {
      const created = await submitEditorAccessRequest()
      setRequest(created)
      setNotice('Editor request submitted. An admin will review your request.')
    } catch (submitError) {
      setError(submitError.message ?? 'Could not submit editor request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="faculty-profile-menu suc-profile-menu" ref={menuRef}>
      <button
        type="button"
        className="suc-profile-menu__trigger faculty-profile-menu__trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open faculty profile"
      >
        <span className="suc-profile-menu__avatar">{initial}</span>
      </button>

      {isOpen && (
        <div className="suc-profile-menu__panel faculty-profile-menu__panel" role="menu">
          <div className="suc-profile-menu__header">
            <p className="suc-profile-menu__name">{displayName}</p>
            <p className="suc-profile-menu__email">{profile?.email || '—'}</p>
          </div>

          {isEditor && (
            <p className="faculty-profile-menu__status" role="status">
              You have editor access.
            </p>
          )}

          {isFaculty && error && (
            <p className="faculty-profile-menu__message faculty-profile-menu__message--error" role="alert">
              {error}
            </p>
          )}

          {isFaculty && notice && (
            <p className="faculty-profile-menu__message" role="status">
              {notice}
            </p>
          )}

          {isFaculty && !isEditor && (
            <button
              type="button"
              className="faculty-profile-menu__request suc-btn suc-btn--primary suc-btn--sm suc-btn--block"
              onClick={handleRequestEditor}
              disabled={pendingRequest || isSubmitting}
            >
              {pendingRequest ? 'Editor Request Pending' : 'Request to be Editor'}
            </button>
          )}

          <button
            type="button"
            className="faculty-profile-menu__logout suc-btn suc-btn--secondary suc-btn--sm suc-btn--block"
            onClick={() => signOut()}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default FacultyProfileMenu
