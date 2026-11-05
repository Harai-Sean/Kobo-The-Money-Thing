import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { App } from '../app/App'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ClearCacheOnSignOut } from '../features/auth/ClearCacheOnSignOut'
import { createFakeAuth, type FakeAuth } from './fakeAuth'

/** Renders the whole app at a URL, wired to a fake auth service. Returns handles for the test. */
export function renderApp(path: string, auth: FakeAuth = createFakeAuth()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider auth={auth}>
          <ClearCacheOnSignOut />
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { auth, user, queryClient }
}
