import { vi } from 'vitest'
import type { AuthSession } from '../features/auth/auth-context'

type Listener = (event: string, session: AuthSession | null) => void

export const TEST_EMAIL = 'ada@example.com'
export const TEST_PASSWORD = 'correct-horse-battery'
export const signedInSession: AuthSession = { user: { id: 'user-1', email: TEST_EMAIL } }

/** A stand-in for Supabase Auth: no network, fully controllable, and it records every call. */
export function createFakeAuth(initial: AuthSession | null = null) {
  let session = initial
  const listeners = new Set<Listener>()

  function emit(event: string, next: AuthSession | null) {
    session = next
    listeners.forEach((listener) => listener(event, next))
  }

  return {
    emit,
    getSession: vi.fn(async () => ({ data: { session } })),
    onAuthStateChange: vi.fn((listener: Listener) => {
      listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => void listeners.delete(listener) } } }
    }),
    signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
      if (password !== TEST_PASSWORD) return { error: { message: 'Invalid login credentials' } }
      emit('SIGNED_IN', { user: { id: 'user-1', email } })
      return { error: null }
    }),
    signOut: vi.fn(async () => {
      emit('SIGNED_OUT', null)
      return { error: null }
    }),
    updateUser: vi.fn(async (_attributes: { password: string }) => ({
      error: null as { message: string } | null,
    })),
  }
}

export type FakeAuth = ReturnType<typeof createFakeAuth>
