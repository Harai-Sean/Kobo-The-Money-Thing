import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from './useAuth'

/**
 * Security: the query cache holds the last user's data. If we kept it after sign-out, the next
 * person to sign in on the same device would briefly see it. Renders nothing.
 */
export function ClearCacheOnSignOut() {
  const { state } = useAuth()
  const queryClient = useQueryClient()
  useEffect(() => {
    if (state.status === 'signedOut') queryClient.clear()
  }, [state.status, queryClient])
  return null
}
