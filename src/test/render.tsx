import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { App } from '../app/App'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ClearCacheOnSignOut } from '../features/auth/ClearCacheOnSignOut'
import { TransactionsApiContext } from '../features/transactions/api-context'
import { createFakeAuth, type FakeAuth } from './fakeAuth'
import { createFakeTransactionsApi, type FakeTransactionsApi } from './fakeTransactionsApi'

/** Renders the whole app at a URL, wired to fake auth and a fake database. */
export function renderApp(
  path: string,
  auth: FakeAuth = createFakeAuth(),
  api: FakeTransactionsApi = createFakeTransactionsApi(),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider auth={auth}>
          <ClearCacheOnSignOut />
          <TransactionsApiContext.Provider value={api}>
            <App />
          </TransactionsApiContext.Provider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { auth, api, user, queryClient }
}
