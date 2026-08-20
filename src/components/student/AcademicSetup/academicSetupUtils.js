import { NONE_OPTION_VALUE } from '../../../data/mockAcademicSetupOptions'

function normalizeElectivesArray(electives) {
  if (!Array.isArray(electives)) {
    return []
  }

  return electives.filter((value) => value && value !== NONE_OPTION_VALUE)
}

export function profileToFormData(profile) {
  return {
    academicYear: profile?.academic_year ?? '',
    minor: profile?.minor || NONE_OPTION_VALUE,
    electives: normalizeElectivesArray(profile?.electives),
    section: profile?.section ?? '',
    labGroup: profile?.lab_group ?? '',
  }
}

export function formDataToPayload(form) {
  return {
    academicYear: form.academicYear,
    minor: form.minor || NONE_OPTION_VALUE,
    electives: normalizeElectivesArray(form.electives),
    section: form.section || NONE_OPTION_VALUE,
    labGroup: form.labGroup || NONE_OPTION_VALUE,
  }
}

export function validateAcademicSetupForm(form) {
  return Boolean(form.academicYear && form.minor && form.section && form.labGroup)
}

function arraysEqual(left, right) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

export function hasAcademicSetupChanges(initialForm, currentForm) {
  const scalarKeys = ['academicYear', 'minor', 'section', 'labGroup']

  if (scalarKeys.some((key) => initialForm[key] !== currentForm[key])) {
    return true
  }

  return !arraysEqual(initialForm.electives, currentForm.electives)
}

export function toggleElectiveSelection(currentElectives, electiveValue) {
  if (electiveValue === NONE_OPTION_VALUE) {
    return []
  }

  if (currentElectives.includes(electiveValue)) {
    return currentElectives.filter((value) => value !== electiveValue)
  }

  return [...currentElectives, electiveValue]
}

export function removeElective(currentElectives, electiveValue) {
  return currentElectives.filter((value) => value !== electiveValue)
}
