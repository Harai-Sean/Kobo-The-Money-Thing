import { createContext } from 'react'

/** The few session fields the app actually uses. Supabase's richer Session satisfies this. */
export type AuthSession = { user: { id: string; email?: string } }

type Failure = { message: string } | null

/**
 * The only parts of Supabase Auth our app depends on. Coding against this small interface
 * (instead of the whole Supabase client) means tests can pass in a simple fake, and the
 * rest of the app never imports Supabase directly.
 */
export interface AuthApi {
  getSession(): Promise<{ data: { session: AuthSession | null } }>
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): {
    data: { subscription: { unsubscribe(): void } }
  }
  signInWithPassword(credentials: { email: string; password: string }): Promise<{ error: Failure }>
  signUp(credentials: {
    email: string
    password: string
    options?: { emailRedirectTo?: string }
  }): Promise<{ data: { session: AuthSession | null }; error: Failure }>
  signOut(): Promise<{ error: Failure }>
  updateUser(attributes: { password: string }): Promise<{ error: Failure }>
}

/** 'loading' = we have not yet asked the browser's stored session whether anyone is signed in. */
export type AuthState =
  { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; session: AuthSession }

/** What happened when someone tried to create an account. */
export type SignUpResult = 'signed-in' | 'confirm-email' | 'rate-limited' | 'error'

export interface AuthContextValue {
  state: AuthState
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  changePassword: (newPassword: string) => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
