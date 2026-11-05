import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AuthContext,
  type AuthApi,
  type AuthContextValue,
  type AuthSession,
  type AuthState,
} from './auth-context'

function toState(session: AuthSession | null): AuthState {
  return session ? { status: 'signedIn', session } : { status: 'signedOut' }
}

export function AuthProvider({ auth, children }: { auth: AuthApi; children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let active = true // guards against updating state after this effect was cleaned up

    // Subscribe FIRST so no sign-in/out event can slip through while getSession is pending.
    // Rule from Supabase's docs: inside this callback only set state. Never call other
    // Supabase functions from it, or the auth client can deadlock.
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      if (active) setState(toState(session))
    })

    // Fallback so the app always leaves 'loading', even if no event arrives. If an event
    // already set the state, keep that newer answer.
    auth
      .getSession()
      .then(({ data }) => {
        if (active) setState((prev) => (prev.status === 'loading' ? toState(data.session) : prev))
      })
      .catch(() => {
        if (active) setState((prev) => (prev.status === 'loading' ? { status: 'signedOut' } : prev))
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [auth])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await auth.signInWithPassword({ email, password })
      return error === null // on success, onAuthStateChange above updates the state for us
    },
    [auth],
  )

  const signOut = useCallback(async () => {
    await auth.signOut() // supabase-js clears the stored session; the listener flips our state
  }, [auth])

  const changePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await auth.updateUser({ password: newPassword })
      return error === null
    },
    [auth],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut, changePassword }),
    [state, signIn, signOut, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
