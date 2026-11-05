import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAuth } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

describe('RequireAuth', () => {
  it('shows a loading state until the stored session has been checked', () => {
    const auth = createFakeAuth()
    auth.getSession.mockImplementation(() => new Promise(() => {})) // never answers
    renderApp('/', auth)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    expect(screen.queryByRole('heading', { name: 'Sign in to Kobo' })).not.toBeInTheDocument()
  })

  it('stops loading even if checking the session fails', async () => {
    const auth = createFakeAuth()
    auth.getSession.mockRejectedValue(new Error('offline'))
    renderApp('/', auth)
    expect(await screen.findByRole('heading', { name: 'Sign in to Kobo' })).toBeInTheDocument()
  })
})
