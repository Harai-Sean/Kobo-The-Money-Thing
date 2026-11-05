import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { createFakeAuth, signedInSession } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

describe('ClearCacheOnSignOut', () => {
  it('wipes cached data when the user signs out', async () => {
    const { user, queryClient } = renderApp('/', createFakeAuth(signedInSession))
    queryClient.setQueryData(['transactions'], [{ id: 1 }])

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    await screen.findByRole('heading', { name: 'Sign in to Kobo' })

    expect(queryClient.getQueryData(['transactions'])).toBeUndefined()
  })
})
