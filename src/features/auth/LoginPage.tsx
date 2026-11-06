import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Logo'
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
    <main className="min-h-screen md:grid md:grid-cols-2">
      <div className="on-dark bg-deep p-8 text-white md:p-14">
        <Logo className="size-10" />
        <p className="mt-10 font-display text-4xl font-bold leading-tight md:text-6xl">
          Type it like you’d <span className="text-lime">say it.</span>
        </p>
        <p className="mt-4 max-w-sm text-white/75">
          coffee 1500 · bolt 2.5k yesterday · +salary 500k
        </p>
      </div>
      <div className="p-8 md:p-14">
        <h1 className="font-display text-3xl font-bold">Sign in to Kobo</h1>
        <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-4">
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
