import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { AuthLayout } from './AuthLayout'
import { passwordSchema } from './schemas'
import { useAuth } from './useAuth'

export function SignUpPage() {
  const { state, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [checkInbox, setCheckInbox] = useState(false)
  const [pending, setPending] = useState(false)

  // Once the account exists and Supabase has signed the person in, go to the app.
  if (state.status === 'signedIn') return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message) // checked here first: no server call for an easy mistake
      return
    }
    setPasswordError(undefined)

    setPending(true)
    const result = await signUp(email.trim(), parsed.data)
    setPending(false)

    if (result === 'confirm-email') setCheckInbox(true)
    else if (result === 'rate-limited')
      setError('Too many attempts. Please wait a few minutes and try again.')
    else if (result === 'error')
      setError(
        'We could not create your account. Check your details, or sign in if you already have one.',
      )
    // 'signed-in': the auth listener updates the state and the redirect above takes over.
  }

  return (
    <AuthLayout title="Create your Kobo account">
      {checkInbox ? (
        <p role="status" className="mt-4 max-w-sm rounded-3xl bg-tint-blue p-5 font-semibold">
          Check your email. We sent a link to {email.trim()}. Confirm it, then come back and sign
          in.
        </p>
      ) : (
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
            autoComplete="new-password"
            required
            value={password}
            error={passwordError}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-sm text-muted">
            Kobo can’t reset a forgotten password yet, so keep yours somewhere safe.
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
