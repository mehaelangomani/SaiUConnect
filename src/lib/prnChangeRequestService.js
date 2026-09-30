import { supabase } from './supabase'

/**
 * Create a PRN change request for the currently logged-in student.
 */
export async function createPRNChangeRequest({
  studentId,
  currentPRN,
  requestedPRN,
  reason,
}) {
  const trimmedRequestedPRN = String(requestedPRN ?? '').trim()
  const trimmedCurrentPRN = String(currentPRN ?? '').trim()
  const trimmedReason = String(reason ?? '').trim()

  if (!studentId) {
    throw new Error('Student ID is required.')
  }

  if (!trimmedRequestedPRN) {
    throw new Error('Requested PRN is required.')
  }

  if (trimmedCurrentPRN === trimmedRequestedPRN) {
    throw new Error(
      'The requested PRN is the same as your current PRN.',
    )
  }

  const { data, error } = await supabase
    .from('prn_change_requests')
    .insert({
      student_id: studentId,
      current_prn: trimmedCurrentPRN || null,
      requested_prn: trimmedRequestedPRN,
      reason: trimmedReason || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'You already have a pending PRN change request.',
      )
    }

    throw error
  }

  return data
}

/**
 * Get all PRN change requests for the current student.
 */
export async function fetchMyPRNChangeRequests(studentId) {
  if (!studentId) {
    return []
  }

  const { data, error } = await supabase
    .from('prn_change_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get the current student's pending PRN change request.
 */
export async function fetchMyPendingPRNChangeRequest(studentId) {
  if (!studentId) {
    return null
  }

  const { data, error } = await supabase
    .from('prn_change_requests')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * Admin: fetch all PRN change requests.
 */
export async function fetchAdminPRNChangeRequests() {
  const { data: requests, error: requestError } =
    await supabase
      .from('prn_change_requests')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

  if (requestError) {
    throw requestError
  }

  const requestRows = requests ?? []

  if (requestRows.length === 0) {
    return []
  }

  const studentIds = [
    ...new Set(
      requestRows
        .map((request) => request.student_id)
        .filter(Boolean),
    ),
  ]

  if (studentIds.length === 0) {
    return requestRows
  }

  const {
    data: profiles,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('id, name, email, prn')
    .in('id', studentIds)

  if (profileError) {
    throw profileError
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  )

  return requestRows.map((request) => ({
    ...request,
    student:
      profileMap.get(request.student_id) ?? null,
  }))
}

/**
 * Admin: approve or reject a PRN change request.
 */
export async function reviewPRNChangeRequest(
  requestId,
  decision,
  adminNote = '',
) {
  if (!requestId) {
    throw new Error('PRN request ID is required.')
  }

  if (
    decision !== 'approved' &&
    decision !== 'rejected'
  ) {
    throw new Error(
      'Invalid PRN request decision.',
    )
  }

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const adminId = authData?.user?.id

  if (!adminId) {
    throw new Error(
      'Unable to identify the administrator.',
    )
  }

  const { data, error } = await supabase
    .from('prn_change_requests')
    .update({
      status: decision,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_note:
        String(adminNote ?? '').trim() ||
        null,
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(
      'The PRN request could not be updated. It may already have been reviewed.',
    )
  }

  return data
}

/**
 * Admin: update the student's actual PRN after approval.
 *
 * Important:
 * We do NOT fetch the student's profile immediately after
 * updating it. The previous implementation did that and RLS
 * could hide the student's profile from the admin client.
 */
export async function updateStudentPRNFromRequest({
  requestId,
  studentId,
  newPRN,
}) {
  const trimmedPRN = String(newPRN ?? '').trim()

  if (!requestId) {
    throw new Error(
      'PRN request ID is required.',
    )
  }

  if (!studentId) {
    throw new Error('Student ID is required.')
  }

  if (!trimmedPRN) {
    throw new Error('PRN cannot be empty.')
  }

  /*
   * Verify that the request exists and has been approved.
   */
  const {
    data: request,
    error: requestError,
  } = await supabase
    .from('prn_change_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (requestError) {
    throw requestError
  }

  if (!request) {
    throw new Error(
      'The PRN change request could not be found.',
    )
  }

  if (request.status !== 'approved') {
    throw new Error(
      'This PRN request must be approved before editing the PRN.',
    )
  }

  if (request.student_id !== studentId) {
    throw new Error(
      'Student does not match the PRN request.',
    )
  }

  /*
   * Update the student's actual PRN.
   */
  const { error: profileUpdateError } =
    await supabase
      .from('profiles')
      .update({
        prn: trimmedPRN,
      })
      .eq('id', studentId)

  if (profileUpdateError) {
    throw profileUpdateError
  }

  /*
   * Mark the approved request as completed.
   */
  const {
    data: completedRequest,
    error: completionError,
  } = await supabase
    .from('prn_change_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'approved')
    .select()
    .maybeSingle()

  if (completionError) {
    throw completionError
  }

  if (!completedRequest) {
    throw new Error(
      'The PRN was updated, but the request could not be marked as completed.',
    )
  }

  return {
    profile: {
      id: studentId,
      prn: trimmedPRN,
    },
    request: completedRequest,
  }
}