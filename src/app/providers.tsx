import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import type { AuthApi } from '../features/auth/auth-context'
import { ClearCacheOnSignOut } from '../features/auth/ClearCacheOnSignOut'

export function Providers({ auth, children }: { auth: AuthApi; children: ReactNode }) {
  // useState with a function creates the client ONCE per mount and keeps it across re-renders.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  )
  // Order matters: each provider can only be used by the ones nested inside it.
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider auth={auth}>
          <ClearCacheOnSignOut />
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
