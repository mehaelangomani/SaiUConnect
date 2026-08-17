import './ConfirmationDialog.css'

function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="confirmation-dialog-overlay" role="presentation" onClick={onCancel}>
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
        </div>

        <footer className="confirmation-dialog__footer suc-modal__footer">
          <button
            type="button"
            className="suc-btn suc-btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="suc-btn suc-btn--primary"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="suc-spinner" aria-hidden="true" />
                Saving…
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
