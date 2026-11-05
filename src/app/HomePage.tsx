import { useSignedInUser } from '../features/auth/useAuth'

export function HomePage() {
  const user = useSignedInUser()
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-semibold">Kobo</h1>
      <p className="mt-2 text-muted">Signed in as {user.email}. Quick add is coming next.</p>
    </main>
  )
}
