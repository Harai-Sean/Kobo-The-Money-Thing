import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button } from '../../components/ui/Button'
import { LoginShapes } from '../../components/ui/Shapes'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from './useAuth'

/** Only accept internal paths like "/settings". Anything else falls back to home. */
function safeTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

export function LoginPage() {
  const { state, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (state.status === 'signedIn') return <Navigate to={safeTarget(location.state)} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser's own page-reloading form submit
    setError(null)
    setPending(true)
    const ok = await signIn(email.trim(), password)
    setPending(false)
    // One generic message on purpose: never reveal whether the email exists.
    if (!ok) setError('We could not sign you in. Check your email and password and try again.')
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl md:grid md:grid-cols-2 md:items-center md:gap-10">
      <div>
        <LoginShapes className="block h-auto w-full" />
        <div className="px-6 md:px-0">
          <p className="font-display text-5xl font-extrabold leading-none tracking-tight md:text-6xl">
            Type it like you’d say it.
          </p>
          <p className="mt-3 text-muted">coffee 1500 · bolt 2.5k yesterday · +salary 500k</p>
        </div>
      </div>
      <div className="px-6 pb-10 pt-8 md:px-0">
        <h1 className="font-display text-2xl font-extrabold">Sign in to Kobo</h1>
        <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  )
}
