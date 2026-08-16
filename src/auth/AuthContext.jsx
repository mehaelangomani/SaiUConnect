import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserProfile } from '../lib/profileService'
import { isValidRole } from './roles'
import { PROFILE_ERRORS } from './profileErrors'

const AuthContext = createContext(null)

async function resolveProfile(userId) {
  try {
    const profile = await fetchUserProfile(userId)

    if (!profile) {
      return { profile: null, profileError: PROFILE_ERRORS.NOT_FOUND }
    }

    if (!isValidRole(profile.role)) {
      return { profile: null, profileError: PROFILE_ERRORS.INVALID_ROLE }
    }

    return { profile, profileError: null }
  } catch {
    return { profile: null, profileError: PROFILE_ERRORS.FETCH_FAILED }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  const loadProfile = useCallback(async (userId) => {
    setIsProfileLoading(true)
    const result = await resolveProfile(userId)
    setProfile(result.profile)
    setProfileError(result.profileError)
    setIsProfileLoading(false)
    return result
  }, [])

  const clearAuthState = useCallback(() => {
    setUser(null)
    setProfile(null)
    setProfileError(null)
    setIsProfileLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuthState()
  }, [clearAuthState])

  useEffect(() => {
    let isMounted = true

    async function initializeSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) return

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }

      setIsInitializing(false)
    }

    initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'INITIAL_SESSION') {
          return
        }

        if (event === 'SIGNED_OUT') {
          clearAuthState()
          return
        }

        if (session?.user) {
          setUser(session.user)

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await loadProfile(session.user.id)
          }
        } else {
          clearAuthState()
        }
      },
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [clearAuthState, loadProfile])

  const value = useMemo(
    () => ({
      user,
      profile,
      profileError,
      isInitializing,
      isProfileLoading,
      isAuthenticated: Boolean(user),
      hasValidProfile: Boolean(profile && !profileError),
      signOut,
      refreshProfile: () => (user ? loadProfile(user.id) : Promise.resolve(null)),
    }),
    [
      user,
      profile,
      profileError,
      isInitializing,
      isProfileLoading,
      signOut,
      loadProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
