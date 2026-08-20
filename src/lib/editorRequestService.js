import { supabase } from './supabase'

export const EDITOR_ACCESS_REQUEST_TYPE = 'editor_access'

export async function fetchMyEditorAccessRequest() {
  const { data, error } = await supabase
    .from('admin_requests')
    .select('id, request_type, payload, status, created_at, updated_at')
    .eq('request_type', EDITOR_ACCESS_REQUEST_TYPE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function submitEditorAccessRequest() {
  const { data, error } = await supabase.rpc('request_editor_access')

  if (error) {
    throw error
  }

  return data
}

export async function fetchMyNotifications() {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('id, title, message, notification_type, payload, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    if (error.code === '42P01') {
      return []
    }
    throw error
  }

  return data ?? []
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    throw error
  }
}
