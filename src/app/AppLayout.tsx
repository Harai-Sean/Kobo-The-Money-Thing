import { Link, Outlet } from 'react-router'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../features/auth/useAuth'

/** The frame around every signed-in page: header with navigation, then the page itself. */
export function AppLayout() {
  const { signOut } = useAuth()
  return (
    <>
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight"
        >
          <Logo className="size-8" />
          Kobo
        </Link>
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold"
        >
          <Link to="/sheet" className="underline underline-offset-4">
            Sheet
          </Link>
          <Link to="/settings" className="underline underline-offset-4">
            Settings
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void signOut()}
            className="underline underline-offset-4"
          >
            Sign out
          </button>
        </nav>
      </header>
      <Outlet />
    </>
  )
}
