import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { AuthLayout } from './AuthLayout'
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
    <AuthLayout title="Sign in to Kobo">
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
      <p className="mt-6 text-sm">
        New here?{' '}
        <Link to="/signup" className="font-semibold underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
