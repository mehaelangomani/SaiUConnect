export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 17) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

export function getStudentDisplayName(profile) {
  if (profile?.name?.trim()) {
    return profile.name.trim()
  }

  if (profile?.email) {
    return profile.email.split('@')[0]
  }

  return 'Student'
}

export function getStudentFirstName(profile) {
  const displayName = getStudentDisplayName(profile)
  const [firstName] = displayName.split(/\s+/)

  return firstName || 'Student'
}
