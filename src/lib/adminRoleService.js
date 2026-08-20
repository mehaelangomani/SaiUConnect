import { supabase } from './supabase'
import { ROLES } from '../auth/roles'

export async function fetchEditors() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('role', ROLES.EDITOR)
    .order('email')
  if (error) throw error
  return data ?? []
}

export async function removeEditorRole(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: ROLES.FACULTY })
    .eq('id', userId)
    .eq('role', ROLES.EDITOR)
  if (error) throw error
}

export async function stopBeingEditor(userId) {
  return removeEditorRole(userId)
}

export async function appointAdmin(newAdminEmail, currentAdminId) {
  const normalizedEmail = String(newAdminEmail).trim().toLowerCase()

  const { data: targetProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (!targetProfile) {
    throw new Error('No profile exists for that email. The user must already have an account.')
  }

  const { error: promoteError } = await supabase
    .from('profiles')
    .update({ role: ROLES.ADMIN })
    .eq('id', targetProfile.id)

  if (promoteError) {
    throw promoteError
  }

  const { error: demoteError } = await supabase
    .from('profiles')
    .update({ role: ROLES.FACULTY })
    .eq('id', currentAdminId)

  if (demoteError) {
    throw demoteError
  }

  return targetProfile
}

export async function reviewEditorAccessRequest(requestId, decision) {
  const { error } = await supabase.rpc('review_editor_access_request', {
    p_request_id: requestId,
    p_decision: decision,
  })
  if (error) throw error
}

export async function fetchAdminRequests() {
  const { data, error } = await supabase
    .from('admin_requests')
    .select('id, request_type, payload, status, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    if (error.code === '42P01') {
      return []
    }
    throw error
  }
  return data ?? []
}

export async function updateAdminRequestStatus(requestId, status) {
  const { error } = await supabase
    .from('admin_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) throw error
}
