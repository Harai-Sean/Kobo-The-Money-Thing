import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { App } from './App'

// MemoryRouter lets a test choose the URL without a real browser address bar.
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routes', () => {
  it('shows the home page at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown addresses', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
