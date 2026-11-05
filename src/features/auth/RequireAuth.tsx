import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/** Route guard: only lets signed-in people through to the pages nested inside it. */
export function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return (
      <p role="status" className="p-6 text-muted">
        Loading…
      </p>
    )
  }
  if (state.status === 'signedOut') {
    // Remember where they were going so login can send them back there afterwards.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
