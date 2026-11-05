import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, signedInSession, TEST_EMAIL } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

async function openSettings() {
  const auth = createFakeAuth(signedInSession)
  const utils = renderApp('/settings', auth)
  await screen.findByRole('heading', { name: 'Settings' })
  return { ...utils, auth }
}

describe('SettingsPage', () => {
  it('shows who is signed in', async () => {
    await openSettings()
    expect(screen.getByText(`Signed in as ${TEST_EMAIL}`)).toBeInTheDocument()
  })

  it('rejects a password shorter than 10 characters without calling the server', async () => {
    const { user, auth } = await openSettings()
    await user.type(screen.getByLabelText('New password'), 'short')
    await user.type(screen.getByLabelText('Confirm new password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(screen.getByText('Use at least 10 characters.')).toBeInTheDocument()
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('rejects two passwords that do not match', async () => {
    const { user, auth } = await openSettings()
    await user.type(screen.getByLabelText('New password'), 'a-long-enough-password')
    await user.type(screen.getByLabelText('Confirm new password'), 'a-different-password')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(screen.getByText('The two passwords do not match.')).toBeInTheDocument()
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('updates the password and confirms it', async () => {
    const { user, auth } = await openSettings()
    await user.type(screen.getByLabelText('New password'), 'a-long-enough-password')
    await user.type(screen.getByLabelText('Confirm new password'), 'a-long-enough-password')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Password updated.')
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'a-long-enough-password' })
    expect(screen.getByLabelText('New password')).toHaveValue('')
  })

  it('shows an error when the server refuses', async () => {
    const { user, auth } = await openSettings()
    auth.updateUser.mockResolvedValue({ error: { message: 'nope' } })
    await user.type(screen.getByLabelText('New password'), 'a-long-enough-password')
    await user.type(screen.getByLabelText('Confirm new password'), 'a-long-enough-password')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not change your password')
  })
})
