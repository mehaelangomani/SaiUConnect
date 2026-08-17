import { useHistoryNavigation } from '../../../hooks/useHistoryNavigation'
import './AppNavigation.css'

function AppNavigation() {
  const { canGoBack, canGoForward, goBack, goForward } = useHistoryNavigation()

  return (
    <nav className="app-navigation" aria-label="Application navigation">
      <button
        type="button"
        className="app-navigation__btn suc-btn suc-btn--ghost suc-btn--sm"
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Go back to previous page"
        title="Back"
      >
        <span aria-hidden="true">←</span>
        <span className="app-navigation__label">Back</span>
      </button>

      <button
        type="button"
        className="app-navigation__btn suc-btn suc-btn--ghost suc-btn--sm"
        onClick={goForward}
        disabled={!canGoForward}
        aria-label="Go forward to next page"
        title="Forward"
      >
        <span className="app-navigation__label">Forward</span>
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  )
}

export default AppNavigation
