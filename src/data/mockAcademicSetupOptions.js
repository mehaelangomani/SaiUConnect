/**
 * Centralized academic setup options shared by the student setup and summary.
 */

export const NONE_OPTION_VALUE = 'none'

export const ACADEMIC_YEAR_OPTIONS = [
  { value: 'year-1', label: 'Year 1' },
  { value: 'year-2', label: 'Year 2' },
  { value: 'year-3', label: 'Year 3' },
  { value: 'year-4', label: 'Year 4' },
  { value: 'year-5', label: 'Year 5' },
]

export const TIMETABLE_YEAR_OPTIONS = [
  { value: 'year-1', label: 'Year 1' },
  { value: 'year-2', label: 'Year 2' },
  { value: 'year-3', label: 'Year 3' },
  { value: 'year-4', label: 'Year 4' },
  { value: 'year-5', label: 'Year 5' },
]

export function formatTimetableYearLabel(yearCode) {
  if (!yearCode) {
    return null
  }

  return (
    TIMETABLE_YEAR_OPTIONS.find(
      (option) => option.value === yearCode,
    )?.label ?? yearCode
  )
}

export const SEMESTER_OPTIONS = [
  { value: 'spring-2026', label: 'Spring 2026' },
  { value: 'fall-2025', label: 'Fall 2025' },
  { value: 'spring-2025', label: 'Spring 2025' },
  { value: 'fall-2024', label: 'Fall 2024' },
]

export const MINOR_OPTIONS = [
  { value: NONE_OPTION_VALUE, label: 'None' },
  {
    value: 'economics',
    label: 'Economics (Placeholder)',
  },
  {
    value: 'psychology',
    label: 'Psychology (Placeholder)',
  },
  {
    value: 'data-science',
    label: 'Data Science (Placeholder)',
  },
  {
    value: 'philosophy',
    label: 'Philosophy (Placeholder)',
  },
]

export const ELECTIVE_OPTIONS = [
  { value: NONE_OPTION_VALUE, label: 'None' },
  {
    value: 'ml',
    label: 'Machine Learning',
  },
  {
    value: 'cyber-security',
    label: 'Cyber Security',
  },
  {
    value: 'cloud-computing',
    label: 'Cloud Computing (Placeholder)',
  },
  {
    value: 'human-computer-interaction',
    label: 'Human-Computer Interaction (Placeholder)',
  },
  {
    value: 'entrepreneurship',
    label: 'Entrepreneurship (Placeholder)',
  },
]

export const DEPRECATED_ELECTIVE_CODES = [
  'machine-learning',
]

export const SECTION_OPTIONS = [
  { value: '1', label: 'Section 1' },
  { value: '2', label: 'Section 2' },
  { value: '3', label: 'Section 3' },
  { value: '4', label: 'Section 4' },
  { value: '5', label: 'Section 5' },
  { value: '6', label: 'Section 6' },
  { value: '7', label: 'Section 7' },
  { value: '8', label: 'Section 8' },
  { value: NONE_OPTION_VALUE, label: 'None' },
]

export const LAB_GROUP_OPTIONS = [
  { value: 'lab-1', label: 'Lab Group 1' },
  { value: 'lab-2', label: 'Lab Group 2' },
  { value: 'lab-3', label: 'Lab Group 3' },
  { value: 'lab-4', label: 'Lab Group 4' },
  { value: 'lab-5', label: 'Lab Group 5' },
  { value: 'lab-6', label: 'Lab Group 6' },
  { value: 'lab-7', label: 'Lab Group 7' },
  { value: 'lab-8', label: 'Lab Group 8' },
  { value: NONE_OPTION_VALUE, label: 'None' },
]

export function getElectiveLabel(value) {
  if (!value || value === NONE_OPTION_VALUE) {
    return 'None'
  }

  return (
    ELECTIVE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  )
}

export function getOptionLabel(options, value) {
  if (!value || value === NONE_OPTION_VALUE) {
    return 'None'
  }

  return (
    options.find(
      (option) => option.value === value,
    )?.label ?? value
  )
}

export function getElectiveOptionsForSelection() {
  return ELECTIVE_OPTIONS.filter(
    (option) => option.value !== NONE_OPTION_VALUE,
  )
}

export function formatElectivesDisplay(electives) {
  if (!electives || electives.length === 0) {
    return 'None'
  }

  return electives
    .map((value) => getElectiveLabel(value))
    .join(', ')
}