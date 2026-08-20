import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutocompleteField from '../common/AutocompleteField/AutocompleteField'
import ConfirmationDialog from '../common/ConfirmationDialog/ConfirmationDialog'
import {
  COURSE_CATEGORY_LABELS,
  createCourse,
  createFacultyMember,
  createSchool,
  createSection,
  deactivateCourse,
  deactivateFacultyMember,
  deactivateSchool,
  deactivateSection,
  getCourseCategoryLabel,
  getCourseCategoryValue,
} from '../../lib/adminCatalogService'
import {
  saveTimetableCell,
  TimetableConflictError,
  unpublishTimetableCell,
} from '../../lib/timetableEditorService'
import { TIMETABLE_YEAR_OPTIONS } from '../../data/mockAcademicSetupOptions'
import './TimetableCellEditor.css'

const COURSE_FIELD_OPTIONS = Object.values(COURSE_CATEGORY_LABELS).map((label) => ({
  value: getCourseCategoryValue(label),
  label,
}))

const FACULTY_ADD_FIELDS = [
  { key: 'name', label: 'Faculty name', placeholder: 'Dr. Jane Doe', required: true },
  {
    key: 'email',
    label: 'Faculty email',
    placeholder: 'jane@saiuniversity.edu.in',
    type: 'email',
    required: true,
  },
]

function parseSectionValueFromEntry(audiences = []) {
  const sectionAudience = audiences.find((item) => item.audience_type === 'section')
  if (!sectionAudience) {
    return ''
  }

  const normalized = String(sectionAudience.audience_code).replace(/^section-?/i, '')
  if (normalized === 'none') {
    return 'none'
  }
  if (/^\d+$/.test(normalized)) {
    return normalized
  }
  return ''
}

function TimetableCellEditor({
  isOpen,
  cellContext,
  entry,
  schools,
  faculty,
  courses,
  sections = [],
  onClose,
  onSaved,
  onRefreshCatalog,
  academicTermId,
}) {
  const [schoolId, setSchoolId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [facultyMemberId, setFacultyMemberId] = useState('')
  const [courseCategory, setCourseCategory] = useState('')
  const [yearValue, setYearValue] = useState('')
  const [sectionValue, setSectionValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const initializedCellKeyRef = useRef(null)

  const cellKey = cellContext ? `${cellContext.timeSlotId}:${cellContext.roomId}` : null

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId),
    [courses, courseId],
  )

  const schoolCourses = useMemo(
    () => (schoolId ? courses.filter((course) => course.school_id === schoolId) : []),
    [courses, schoolId],
  )

  const schoolOptions = useMemo(
    () =>
      schools.map((school) => ({
        id: school.id,
        code: school.code,
        label: school.code,
      })),
    [schools],
  )

  const facultyOptions = useMemo(
    () =>
      faculty.map((member) => ({
        id: member.id,
        label: member.name,
      })),
    [faculty],
  )

  const courseOptions = useMemo(
    () =>
      schoolCourses.map((course) => ({
        id: course.id,
        label: course.name,
        category: course.category,
      })),
    [schoolCourses],
  )

  const sectionOptions = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        value: section.code,
        label: section.label,
      })),
    [sections],
  )

  const handleSchoolChange = useCallback(
    (newSchoolId) => {
      if (!newSchoolId) {
        setSchoolId('')
        return
      }

      setSchoolId(newSchoolId)

      setCourseId((currentCourseId) => {
        if (!currentCourseId) {
          return currentCourseId
        }
        const course = courses.find((item) => item.id === currentCourseId)
        if (course && course.school_id !== newSchoolId) {
          return ''
        }
        return currentCourseId
      })
    },
    [courses],
  )

  useEffect(() => {
    if (!isOpen) {
      initializedCellKeyRef.current = null
      return
    }

    if (!cellKey) {
      return
    }

    if (initializedCellKeyRef.current === cellKey) {
      return
    }

    initializedCellKeyRef.current = cellKey
    setError(null)
    setSuccess(false)

    if (entry) {
      setSchoolId(entry.schoolId ?? '')
      setCourseId(entry.courseId ?? '')
      setFacultyMemberId(entry.facultyMemberId ?? '')
      setCourseCategory(entry.courseCategory ?? '')
      setYearValue(entry.year ?? '')
      setSectionValue(parseSectionValueFromEntry(entry.audiences))
      return
    }

    setSchoolId('')
    setCourseId('')
    setFacultyMemberId('')
    setCourseCategory('')
    setYearValue('')
    setSectionValue('')
  }, [isOpen, cellKey, entry])

  if (!isOpen || !cellContext) {
    return null
  }

  const handleDone = async () => {
    if (!schoolId || !courseId || !facultyMemberId || !courseCategory) {
      setError('School, faculty, course, and course field are required.')
      return
    }

    if (!yearValue) {
      setError('Select a year before saving this class.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await saveTimetableCell({
        entry,
        academicTermId,
        schoolId,
        courseId,
        facultyMemberId,
        roomId: cellContext.roomId,
        timeSlotId: cellContext.timeSlotId,
        sectionValue,
        year: yearValue,
        courseCategory,
        isPublished: true,
      })
      setSuccess(true)
      onSaved()
      setTimeout(() => {
        onClose()
      }, 600)
    } catch (saveError) {
      setError(
        saveError instanceof TimetableConflictError
          ? saveError.message
          : saveError.message ?? 'Could not save timetable entry.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    if (!entry) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await unpublishTimetableCell(entry)
      onSaved()
      setShowClearConfirm(false)
      onClose()
    } catch (clearError) {
      setError(clearError.message ?? 'Could not clear cell.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button type="button" className="timetable-cell-editor__backdrop" onClick={onClose} aria-label="Close editor" />
      <aside className="timetable-cell-editor suc-card" role="dialog" aria-modal="true">
        <header className="timetable-cell-editor__header">
          <div>
            <h3 className="timetable-cell-editor__title">Edit Timetable Cell</h3>
            <p className="timetable-cell-editor__context">
              {cellContext.dayLabel} · {cellContext.timeLabel} · {cellContext.roomLabel}
            </p>
          </div>
          <button type="button" className="timetable-cell-editor__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="timetable-cell-editor__body">
          {error && (
            <div className="suc-alert suc-alert--error" role="alert">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="suc-alert suc-alert--success" role="status">
              <p>Saved successfully.</p>
            </div>
          )}

          <AutocompleteField
            label="Course name"
            value={courseId}
            options={courseOptions}
            placeholder="Select course"
            onChange={(value) => {
              setCourseId(value)
              const course = schoolCourses.find((item) => item.id === value)
              if (course) {
                setCourseCategory(course.category)
              }
            }}
            onAdd={async (name) => {
              if (!schoolId) {
                setError('Select a school before adding a course.')
                return
              }
              const code = String(name).split(' ')[0].toUpperCase().slice(0, 12)
              const created = await createCourse({
                code,
                name,
                category: courseCategory || 'core',
                schoolId,
              })
              await onRefreshCatalog()
              setCourseId(created.id)
            }}
            onDelete={async (option) => {
              const courseRowId = option?.id
              if (!courseRowId) {
                throw new Error('This course is missing a database ID. Refresh and try again.')
              }
              await deactivateCourse(courseRowId)
              await onRefreshCatalog()
              if (courseId === courseRowId) {
                setCourseId('')
              }
            }}
            getOptionValue={(option) => option.id}
            getOptionLabel={(option) => option.label}
            filterOption={(option, query) =>
              option.label.toLowerCase().includes(query.toLowerCase())
            }
            getDeleteConfirmMessage={(option) =>
              `Deactivate ${option.label}? It will be removed from autocomplete but timetable history is preserved.`
            }
            addLabel="+ ADD COURSE"
          />

          <AutocompleteField
            label="Course field"
            value={courseCategory}
            options={COURSE_FIELD_OPTIONS}
            onChange={setCourseCategory}
            allowAdd={false}
            allowDelete={false}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            filterOption={(option, query) =>
              option.label.toLowerCase().includes(query.toLowerCase())
            }
            placeholder="Select course field"
          />

          <AutocompleteField
            label="School"
            value={schoolId}
            options={schoolOptions}
            onChange={handleSchoolChange}
            placeholder="Select school"
            onAdd={async (code) => {
              const created = await createSchool(code, code)
              await onRefreshCatalog()
              setSchoolId(created.id)
            }}
            onDelete={async (option) => {
              const schoolRowId = option?.id
              if (!schoolRowId) {
                throw new Error('This school is missing a database ID. Refresh and try again.')
              }
              await deactivateSchool(schoolRowId)
              await onRefreshCatalog()
              if (schoolId === schoolRowId) {
                setSchoolId('')
              }
            }}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.id}
            filterOption={(option, query) =>
              option.label.toLowerCase().includes(query.toLowerCase())
            }
            getDeleteConfirmMessage={(option) =>
              `Deactivate ${option.label}? It will be removed from autocomplete but timetable history is preserved.`
            }
            addLabel="+ ADD SCHOOL"
          />

          <AutocompleteField
            label="Year"
            value={yearValue}
            options={TIMETABLE_YEAR_OPTIONS}
            onChange={setYearValue}
            placeholder="Select year"
            allowAdd={false}
            allowDelete={false}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            filterOption={(option, query) =>
              option.label.toLowerCase().includes(query.toLowerCase())
            }
          />

          <AutocompleteField
            label="Section"
            value={sectionValue}
            options={sectionOptions}
            onChange={setSectionValue}
            placeholder="Select section"
            onAdd={async (label) => {
              const trimmed = String(label).trim()
              if (!trimmed) {
                return
              }
              const created = await createSection({
                code: trimmed.toLowerCase() === 'none' ? 'none' : trimmed,
                label: trimmed.toLowerCase() === 'none' ? 'None' : trimmed,
              })
              await onRefreshCatalog()
              setSectionValue(created.code)
            }}
            onDelete={async (option) => {
              const sectionRowId = option?.id
              if (!sectionRowId) {
                throw new Error('This section is missing a database ID. Refresh and try again.')
              }
              await deactivateSection(sectionRowId)
              await onRefreshCatalog()
              if (sectionValue === option.value) {
                setSectionValue('')
              }
            }}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            filterOption={(option, query) => {
              const normalized = query.toLowerCase()
              return (
                option.label.toLowerCase().includes(normalized) ||
                option.value.toLowerCase().includes(normalized)
              )
            }}
            getDeleteConfirmMessage={(option) =>
              `Deactivate ${option.label}? It will be removed from autocomplete but timetable history is preserved.`
            }
            addLabel="+ ADD SECTION"
          />

          <AutocompleteField
            label="Faculty name"
            value={facultyMemberId}
            options={facultyOptions}
            onChange={setFacultyMemberId}
            placeholder="Select faculty"
            addFields={FACULTY_ADD_FIELDS}
            onAdd={async (values) => {
              const created = await createFacultyMember({
                name: values.name,
                email: values.email,
              })
              await onRefreshCatalog()
              setFacultyMemberId(created.id)
            }}
            onDelete={async (option) => {
              const facultyRowId = option?.id
              if (!facultyRowId) {
                throw new Error('This faculty member is missing a database ID. Refresh and try again.')
              }
              await deactivateFacultyMember(facultyRowId)
              await onRefreshCatalog()
              if (facultyMemberId === facultyRowId) {
                setFacultyMemberId('')
              }
            }}
            getOptionValue={(option) => option.id}
            filterOption={(option, query) =>
              option.label.toLowerCase().includes(query.toLowerCase())
            }
            getDeleteConfirmMessage={(option) =>
              `Deactivate ${option.label}? They will be removed from autocomplete but timetable history is preserved.`
            }
            addLabel="+ ADD FACULTY"
          />

          {selectedCourse && (
            <p className="timetable-cell-editor__hint">
              Selected: {selectedCourse.name} · {getCourseCategoryLabel(selectedCourse.category)}
            </p>
          )}
        </div>

        <footer className="timetable-cell-editor__footer">
          {entry && (
            <button
              type="button"
              className="suc-btn suc-btn--secondary"
              onClick={() => setShowClearConfirm(true)}
              disabled={isSaving}
            >
              Clear cell
            </button>
          )}
          <button type="button" className="suc-btn suc-btn--primary" onClick={handleDone} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'DONE'}
          </button>
        </footer>
      </aside>

      <ConfirmationDialog
        isOpen={showClearConfirm}
        title="Clear this timetable cell?"
        message="This will unpublish the class so students no longer see it. The room and time slot will remain."
        confirmLabel="Clear"
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
        isLoading={isSaving}
      />
    </>
  )
}

export default TimetableCellEditor
