import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** For screens behind <RequireAuth>: returns the signed-in user, or throws if that is untrue. */
export function useSignedInUser() {
  const { state } = useAuth()
  if (state.status !== 'signedIn') throw new Error('Expected a signed-in user')
  return state.session.user
}
