import { Link, Outlet } from 'react-router'
import { useAuth } from '../features/auth/useAuth'

/** The frame around every signed-in page: header with navigation, then the page itself. */
export function AppLayout() {
  const { signOut } = useAuth()
  return (
    <>
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <Link to="/" className="text-lg font-semibold">
            Kobo
          </Link>
          <nav aria-label="Main" className="flex items-center gap-4">
            <Link to="/settings" className="underline">
              Settings
            </Link>
            <button type="button" onClick={() => void signOut()} className="underline">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  )
}
