import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">That address does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-brand underline">
        Go to the home page
      </Link>
    </main>
  )
}
