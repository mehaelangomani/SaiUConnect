import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

function getHistoryIndex() {
  const idx = window.history.state?.idx
  return typeof idx === 'number' ? idx : 0
}

/**
 * Back/Forward controls backed by the browser history stack managed by React Router.
 * Uses history.state.idx (set by React Router) instead of a parallel custom stack.
 */
export function useHistoryNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const maxIdxRef = useRef(getHistoryIndex())
  const [canGoBack, setCanGoBack] = useState(() => getHistoryIndex() > 0)
  const [canGoForward, setCanGoForward] = useState(false)

  const syncHistoryState = useCallback(() => {
    const idx = getHistoryIndex()

    if (navigationType === 'PUSH') {
      // A new entry replaces any forward history from this point.
      maxIdxRef.current = idx
    } else {
      maxIdxRef.current = Math.max(maxIdxRef.current, idx)
    }

    setCanGoBack(idx > 0)
    setCanGoForward(idx < maxIdxRef.current)
  }, [navigationType])

  useEffect(() => {
    syncHistoryState()
  }, [location, syncHistoryState])

  useEffect(() => {
    const handlePopState = () => {
      const idx = getHistoryIndex()
      setCanGoBack(idx > 0)
      setCanGoForward(idx < maxIdxRef.current)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const goBack = useCallback(() => {
    if (getHistoryIndex() > 0) {
      navigate(-1)
    }
  }, [navigate])

  const goForward = useCallback(() => {
    if (getHistoryIndex() < maxIdxRef.current) {
      navigate(1)
    }
  }, [navigate])

  return { canGoBack, canGoForward, goBack, goForward }
}
