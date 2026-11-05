import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, signedInSession } from '../test/fakeAuth'
import { renderApp } from '../test/render'

describe('App routes', () => {
  it('sends a signed-out visitor to the login page', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Sign in to Kobo' })).toBeInTheDocument()
  })

  it('shows the home page to a signed-in user', async () => {
    renderApp('/', createFakeAuth(signedInSession))
    expect(await screen.findByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown addresses', async () => {
    renderApp('/nope', createFakeAuth(signedInSession))
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('signs out and returns to the login page', async () => {
    const { user } = renderApp('/', createFakeAuth(signedInSession))
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Sign in to Kobo' })).toBeInTheDocument()
  })
})
