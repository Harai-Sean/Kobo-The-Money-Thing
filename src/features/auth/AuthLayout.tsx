import type { ReactNode } from 'react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LoginShapes } from '../../components/ui/Shapes'

/** The shared look of the signed-out pages: shapes and headline on one side, the form on the other. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative mx-auto min-h-screen max-w-5xl md:grid md:grid-cols-2 md:items-center md:gap-10">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
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
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        {children}
      </div>
    </main>
  )
}
