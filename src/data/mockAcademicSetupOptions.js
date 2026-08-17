/**
 * Mock academic setup options — PLACEHOLDER DATA ONLY.
 * Replace with Supabase-backed options in a future release.
 * Centralized here so components do not hardcode selectable values.
 */

export const NONE_OPTION_VALUE = 'none'

export const ACADEMIC_YEAR_OPTIONS = [
  { value: 'year-1', label: 'Year 1 (Placeholder)' },
  { value: 'year-2', label: 'Year 2 (Placeholder)' },
  { value: 'year-3', label: 'Year 3 (Placeholder)' },
  { value: 'year-4', label: 'Year 4 (Placeholder)' },
]

export const SEMESTER_OPTIONS = [
  { value: 'spring-2026', label: 'Spring 2026 (Placeholder)' },
  { value: 'fall-2025', label: 'Fall 2025 (Placeholder)' },
  { value: 'spring-2025', label: 'Spring 2025 (Placeholder)' },
  { value: 'fall-2024', label: 'Fall 2024 (Placeholder)' },
]

export const MINOR_OPTIONS = [
  { value: NONE_OPTION_VALUE, label: 'None' },
  { value: 'economics', label: 'Economics (Placeholder)' },
  { value: 'psychology', label: 'Psychology (Placeholder)' },
  { value: 'data-science', label: 'Data Science (Placeholder)' },
  { value: 'philosophy', label: 'Philosophy (Placeholder)' },
]

export const ELECTIVE_OPTIONS = [
  { value: NONE_OPTION_VALUE, label: 'None' },
  { value: 'machine-learning', label: 'Machine Learning (Placeholder)' },
  { value: 'cloud-computing', label: 'Cloud Computing (Placeholder)' },
  { value: 'human-computer-interaction', label: 'Human-Computer Interaction (Placeholder)' },
  { value: 'entrepreneurship', label: 'Entrepreneurship (Placeholder)' },
]

export const SECTION_OPTIONS = [
  { value: 'section-a', label: 'Section A (Placeholder)' },
  { value: 'section-b', label: 'Section B (Placeholder)' },
  { value: 'section-c', label: 'Section C (Placeholder)' },
  { value: 'section-d', label: 'Section D (Placeholder)' },
]

export const LAB_GROUP_OPTIONS = [
  { value: 'lab-1', label: 'Lab Group 1 (Placeholder)' },
  { value: 'lab-2', label: 'Lab Group 2 (Placeholder)' },
  { value: 'lab-3', label: 'Lab Group 3 (Placeholder)' },
  { value: 'lab-4', label: 'Lab Group 4 (Placeholder)' },
]

export function getOptionLabel(options, value) {
  if (!value || value === NONE_OPTION_VALUE) {
    return 'None'
  }

  return options.find((option) => option.value === value)?.label ?? value
}

export function getElectiveOptionsForSelection() {
  return ELECTIVE_OPTIONS.filter((option) => option.value !== NONE_OPTION_VALUE)
}

export function formatElectivesDisplay(electives) {
  if (!electives || electives.length === 0) {
    return 'None'
  }

  return electives
    .map((value) => getOptionLabel(ELECTIVE_OPTIONS, value))
    .join(', ')
}
