import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog'
import './AutocompleteField.css'

function AutocompleteField({
  label,
  value,
  options,
  onChange,
  onAdd,
  onDelete,
  addLabel = '+ ADD',
  addDoneLabel = 'DONE / ADD',
  placeholder = 'Search…',
  disabled = false,
  allowAdd = true,
  allowDelete = true,
  addFields = null,
  getOptionLabel = (option) => option.label ?? option.name ?? option.code ?? String(option),
  getOptionValue = (option) => option.value ?? option.id ?? option.code ?? option,
  filterOption = (option, query) =>
    getOptionLabel(option).toLowerCase().includes(query.toLowerCase()),
  getDeleteConfirmMessage = null,
}) {
  const listboxId = useId()
  const containerRef = useRef(null)
  const isEditingRef = useRef(false)
  const getOptionValueRef = useRef(getOptionValue)
  const getOptionLabelRef = useRef(getOptionLabel)
  const filterOptionRef = useRef(filterOption)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [addFormValues, setAddFormValues] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  getOptionValueRef.current = getOptionValue
  getOptionLabelRef.current = getOptionLabel
  filterOptionRef.current = filterOption

  const selectedLabel = useMemo(() => {
    const option = options.find((item) => getOptionValueRef.current(item) === value)
    return option ? getOptionLabelRef.current(option) : ''
  }, [options, value])

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return options
    }
    return options.filter((option) => filterOptionRef.current(option, trimmed))
  }, [options, query])

  const previousValueRef = useRef(value)

  const syncQueryFromValue = () => {
    if (value && selectedLabel) {
      setQuery(selectedLabel)
      return
    }
    if (!value) {
      setQuery('')
    }
  }

  useEffect(() => {
    if (previousValueRef.current === value) {
      return
    }
    previousValueRef.current = value
    stopEditing()
  }, [value])

  useEffect(() => {
    if (isEditingRef.current) {
      return
    }
    if (value && selectedLabel) {
      setQuery(selectedLabel)
      return
    }
    if (!value) {
      setQuery('')
    }
  }, [value, selectedLabel])

  const stopEditing = () => {
    isEditingRef.current = false
  }

  const startEditing = () => {
    isEditingRef.current = true
  }

  useEffect(() => {
    if (!isAdding || !addFields) {
      return
    }
    const initial = {}
    for (const field of addFields) {
      initial[field.key] = ''
    }
    setAddFormValues(initial)
  }, [isAdding, addFields])

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current?.contains(event.target)) {
        return
      }
      if (event.target instanceof Element && event.target.closest('.confirmation-dialog-overlay')) {
        return
      }
      setIsOpen(false)
      setIsAdding(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const handleSelect = (option) => {
    stopEditing()
    onChange(getOptionValue(option))
    setQuery(getOptionLabel(option))
    setIsOpen(false)
    setIsAdding(false)
  }

  const handleAddDone = async () => {
    if (!onAdd) {
      return
    }

    if (addFields) {
      const values = {}
      for (const field of addFields) {
        values[field.key] = String(addFormValues[field.key] ?? '').trim()
      }
      const hasEmptyRequired = addFields.some((field) => field.required !== false && !values[field.key])
      if (hasEmptyRequired) {
        return
      }
      await onAdd(values)
      setAddFormValues({})
      setIsAdding(false)
      setIsOpen(false)
      return
    }

    const trimmed = newValue.trim()
    if (!trimmed) {
      return
    }
    await onAdd(trimmed)
    setNewValue('')
    setIsAdding(false)
    setIsOpen(false)
  }

  const handleDeleteClick = (option, event) => {
    event.preventDefault()
    event.stopPropagation()

    const message = getDeleteConfirmMessage
      ? getDeleteConfirmMessage(option)
      : `Remove ${getOptionLabel(option)}?`

    setDeleteError(null)
    setDeleteConfirm({
      option,
      message,
    })
  }

  const handleDeleteCancel = () => {
    if (isDeleting) {
      return
    }
    setDeleteConfirm(null)
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !onDelete || isDeleting) {
      return
    }

    const optionToDelete = deleteConfirm.option
    const optionId = getOptionValue(optionToDelete)

    setIsDeleting(true)
    setDeleteError(null)

    try {
      if (!optionId) {
        throw new Error('Cannot remove item: missing database ID.')
      }

      await onDelete(optionToDelete)

      if (optionId === value) {
        stopEditing()
        onChange('')
        setQuery('')
      }

      setDeleteConfirm(null)
      setDeleteError(null)
      setIsOpen(false)
    } catch (deleteFailure) {
      const message =
        deleteFailure?.message ??
        deleteFailure?.error_description ??
        'Could not remove item. Please try again.'
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteDialog = (
    <ConfirmationDialog
      isOpen={Boolean(deleteConfirm)}
      title="Confirm removal"
      message={deleteConfirm?.message}
      errorMessage={deleteError}
      confirmLabel="Remove"
      loadingLabel="Removing…"
      onConfirm={handleDeleteConfirm}
      onCancel={handleDeleteCancel}
      isLoading={isDeleting}
    />
  )

  return (
    <div className="autocomplete-field" ref={containerRef}>
      <label className="suc-label">{label}</label>
      <input
        className="suc-input"
        type="text"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onBlur={() => {
          stopEditing()
          syncQueryFromValue()
        }}
        onChange={(event) => {
          startEditing()
          setQuery(event.target.value)
          setIsOpen(true)
          if (!event.target.value.trim()) {
            stopEditing()
            onChange('')
          }
        }}
      />

      {isOpen && (
        <ul id={listboxId} className="autocomplete-field__list" role="listbox">
          {allowAdd && onAdd && (
            <li className="autocomplete-field__add-row">
              {isAdding ? (
                <div className="autocomplete-field__add-form">
                  {addFields ? (
                    <div className="autocomplete-field__add-fields">
                      {addFields.map((field) => (
                        <label key={field.key} className="autocomplete-field__add-field">
                          <span className="autocomplete-field__add-field-label">{field.label}</span>
                          <input
                            className="suc-input"
                            type={field.type ?? 'text'}
                            value={addFormValues[field.key] ?? ''}
                            onChange={(event) =>
                              setAddFormValues((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            autoFocus={field.key === addFields[0]?.key}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      className="suc-input"
                      value={newValue}
                      onChange={(event) => setNewValue(event.target.value)}
                      placeholder={`New ${label.toLowerCase()}`}
                      autoFocus
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleAddDone()
                        }
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className="suc-btn suc-btn--primary suc-btn--sm"
                    onClick={handleAddDone}
                  >
                    {addDoneLabel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="autocomplete-field__add-btn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsAdding(true)}
                >
                  {addLabel}
                </button>
              )}
            </li>
          )}

          {filteredOptions.length === 0 && !isAdding && (
            <li className="autocomplete-field__empty">No matches</li>
          )}

          {filteredOptions.map((option) => {
            const optionValue = getOptionValue(option)
            const optionLabel = getOptionLabel(option)
            return (
              <li key={optionValue} className="autocomplete-field__option">
                <button
                  type="button"
                  className="autocomplete-field__option-btn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                >
                  {optionLabel}
                </button>
                {allowDelete && onDelete && (
                  <button
                    type="button"
                    className="autocomplete-field__delete-btn"
                    aria-label={`Remove ${optionLabel}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => handleDeleteClick(option, event)}
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {typeof document !== 'undefined'
        ? createPortal(deleteDialog, document.body)
        : deleteDialog}
    </div>
  )
}

export default AutocompleteField
