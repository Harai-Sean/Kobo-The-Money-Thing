import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, signedInSession, TEST_EMAIL, TEST_PASSWORD } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

describe('LoginPage', () => {
  it('signs in with correct credentials and lands on the home page', async () => {
    const { user, auth } = renderApp('/login')
    await user.type(await screen.findByLabelText('Email'), TEST_EMAIL)
    await user.type(screen.getByLabelText('Password'), TEST_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
  })

  it('shows one generic error for a wrong password and stays on the page', async () => {
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText('Email'), TEST_EMAIL)
    await user.type(screen.getByLabelText('Password'), 'wrong-password-123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not sign you in')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('sends the person back to the page they originally wanted', async () => {
    const { user } = renderApp('/settings')
    await user.type(await screen.findByLabelText('Email'), TEST_EMAIL)
    await user.type(screen.getByLabelText('Password'), TEST_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('skips the login page for someone who is already signed in', async () => {
    renderApp('/login', createFakeAuth(signedInSession))
    expect(await screen.findByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
  })

  it('lets you show and hide the password while typing', async () => {
    const { user } = renderApp('/login')
    const field = await screen.findByLabelText('Password')
    await user.type(field, 'secret-value')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(field).toHaveAttribute('type', 'text')
    expect(field).toHaveValue('secret-value') // nothing typed is lost by toggling
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(field).toHaveAttribute('type', 'password')
  })
})
