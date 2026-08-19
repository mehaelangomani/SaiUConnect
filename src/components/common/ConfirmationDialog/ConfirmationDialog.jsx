import { useState } from 'react'
import './ConfirmationDialog.css'

function ConfirmationDialog({
  isOpen,
  title,
  message,
  errorMessage = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel = 'Saving…',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const isBusy = isLoading || isConfirming

  if (!isOpen) {
    return null
  }

  const handleConfirm = async () => {
    if (!onConfirm || isBusy) {
      return
    }

    const result = onConfirm()
    if (!result || typeof result.then !== 'function') {
      return
    }

    setIsConfirming(true)
    try {
      await result
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="confirmation-dialog-overlay" role="presentation" onClick={isBusy ? undefined : onCancel}>
      <div
        className="confirmation-dialog suc-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="confirmation-dialog__header suc-modal__header">
          <h2 id="confirmation-dialog-title" className="confirmation-dialog__title suc-modal__title">
            {title}
          </h2>
        </header>

        <div className="confirmation-dialog__body suc-modal__body">
          <p id="confirmation-dialog-message" className="confirmation-dialog__message">
            {message}
          </p>
          {errorMessage && (
            <p className="confirmation-dialog__error suc-alert suc-alert--error" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <footer className="confirmation-dialog__footer suc-modal__footer">
          <button
            type="button"
            className="suc-btn suc-btn--secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="suc-btn suc-btn--primary"
            onClick={handleConfirm}
            disabled={isBusy}
            aria-busy={isBusy}
          >
            {isBusy ? (
              <>
                <span className="suc-spinner" aria-hidden="true" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ConfirmationDialog
