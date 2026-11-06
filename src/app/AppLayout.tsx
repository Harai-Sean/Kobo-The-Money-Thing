import { Link, Outlet } from 'react-router'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../features/auth/useAuth'

/** The frame around every signed-in page: header with navigation, then the page itself. */
export function AppLayout() {
  const { signOut } = useAuth()
  return (
    <>
      <header className="on-dark bg-deep text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
            <Logo className="size-7" />
            Kobo
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 text-sm">
            <Link to="/settings" className="underline decoration-lime underline-offset-4">
              Settings
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="underline decoration-lime underline-offset-4"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  )
}
