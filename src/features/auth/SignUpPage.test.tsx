import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, signedInSession } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

const email = 'new@example.com'
const strongPassword = 'a-long-enough-password'

async function fillAndSubmit(
  user: ReturnType<typeof renderApp>['user'],
  password = strongPassword,
) {
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('SignUpPage', () => {
  it('creates an account and lands in the app when no email confirmation is needed', async () => {
    const { user, auth } = renderApp('/signup')
    await fillAndSubmit(user)
    expect(await screen.findByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email, password: strongPassword }),
    )
  })

  it('asks the person to check their email when confirmation is switched on', async () => {
    const auth = createFakeAuth()
    auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null })
    const { user } = renderApp('/signup', auth)
    await fillAndSubmit(user)
    expect(await screen.findByRole('status')).toHaveTextContent(
      `Check your email. We sent a link to ${email}`,
    )
  })

  it('rejects a short password without calling the server', async () => {
    const { user, auth } = renderApp('/signup')
    await fillAndSubmit(user, 'short')
    expect(await screen.findByText('Use at least 10 characters.')).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('explains a rate limit in plain words', async () => {
    const auth = createFakeAuth()
    auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'email rate limit exceeded' },
    })
    const { user } = renderApp('/signup', auth)
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })

  it('shows one generic message for any other failure', async () => {
    const auth = createFakeAuth()
    auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'User already registered' },
    })
    const { user } = renderApp('/signup', auth)
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not create your account')
  })

  it('is linked from the login page, and links back', async () => {
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('link', { name: 'Create an account' }))
    expect(
      await screen.findByRole('heading', { name: 'Create your Kobo account' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Sign in' }))
    expect(await screen.findByRole('heading', { name: 'Sign in to Kobo' })).toBeInTheDocument()
  })

  it('sends someone who is already signed in straight to the app', async () => {
    renderApp('/signup', createFakeAuth(signedInSession))
    expect(await screen.findByRole('heading', { name: 'Kobo' })).toBeInTheDocument()
  })
})
