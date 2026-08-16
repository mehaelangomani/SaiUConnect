export const PROFILE_ERRORS = {
  NOT_FOUND: 'not_found',
  INVALID_ROLE: 'invalid_role',
  FETCH_FAILED: 'fetch_failed',
}

export const PROFILE_ERROR_MESSAGES = {
  [PROFILE_ERRORS.NOT_FOUND]:
    'Profile not found. Your account exists but no profile record was found. Please contact an administrator.',
  [PROFILE_ERRORS.INVALID_ROLE]:
    'Your profile has an unrecognized role. Please contact an administrator.',
  [PROFILE_ERRORS.FETCH_FAILED]:
    'Unable to load your profile. Please try again or contact support.',
}
