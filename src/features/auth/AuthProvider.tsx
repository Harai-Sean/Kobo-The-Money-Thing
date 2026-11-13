import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AuthContext,
  type AuthApi,
  type AuthContextValue,
  type AuthSession,
  type AuthState,
  type SignUpResult,
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

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      const { data, error } = await auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error)
        return /rate limit|too many|only request this once/i.test(error.message)
          ? 'rate-limited'
          : 'error'
      // With "Confirm email" off, Supabase signs the new person in straight away (a session).
      // With it on, there is no session until they click the link in their inbox.
      return data.session ? 'signed-in' : 'confirm-email'
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
    () => ({ state, signUp, signIn, signOut, changePassword }),
    [state, signUp, signIn, signOut, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
