import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { changePasswordSchema } from './schemas'
import { useAuth, useSignedInUser } from './useAuth'

export function SettingsPage() {
  const user = useSignedInUser()
  const { changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDone(false)
    setFailed(false)

    const parsed = changePasswordSchema.safeParse({ password, confirm })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setPending(true)
    const ok = await changePassword(parsed.data.password)
    setPending(false)
    if (ok) {
      setDone(true)
      setPassword('')
      setConfirm('')
    } else {
      setFailed(true)
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-muted">Signed in as {user.email}</p>

      <h2 className="mt-8 text-lg font-semibold">Change password</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          error={fieldErrors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {failed && (
          <p role="alert" className="text-sm text-danger">
            We could not change your password. If you signed in a while ago, sign out, sign in
            again, and retry.
          </p>
        )}
        {done && (
          <p role="status" className="text-sm font-medium text-brand">
            Password updated.
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </main>
  )
}
