import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { addDays, todayIso } from '../../lib/dates/dates'
import { createFakeAuth, signedInSession } from '../../test/fakeAuth'
import { renderApp } from '../../test/render'

async function openQuickAdd() {
  const utils = renderApp('/', createFakeAuth(signedInSession))
  const input = await screen.findByRole('textbox', { name: 'Quick add' })
  return { ...utils, input }
}

describe('QuickAdd', () => {
  it('shows a live preview as you type', async () => {
    const { user, input } = await openQuickAdd()
    await user.type(input, 'bolt 2.5k yesterday')

    const preview = screen.getByRole('list', { name: 'Preview' })
    expect(within(preview).getByText('₦2,500')).toBeInTheDocument()
    expect(within(preview).getByLabelText(/Category/)).toHaveDisplayValue('Transport')
    expect(within(preview).getByLabelText(/Date/)).toHaveValue(addDays(todayIso(), -1))
  })

  it('saves on Enter with the right values, then clears the field', async () => {
    const { user, input, api } = await openQuickAdd()
    await user.type(input, 'bolt 2.5k yesterday{Enter}')

    expect(api.addTransaction).toHaveBeenCalledTimes(1)
    expect(api.addTransaction.mock.calls[0]?.[0]).toMatchObject({
      amountMinor: 250_000,
      kind: 'expense',
      categoryId: 'cat-transport',
      note: 'bolt',
      occurredOn: addDays(todayIso(), -1),
    })
    expect(input).toHaveValue('')
    expect(await screen.findByText('Saved ₦2,500 in Transport.')).toBeInTheDocument()
  })

  it('saves income typed with a plus sign', async () => {
    const { user, input, api } = await openQuickAdd()
    await user.type(input, '+salary 500k{Enter}')
    expect(api.addTransaction.mock.calls[0]?.[0]).toMatchObject({
      kind: 'income',
      amountMinor: 50_000_000,
      categoryId: 'cat-salary',
    })
  })

  it('will not save without an amount, and explains why', async () => {
    const { user, input, api } = await openQuickAdd()
    await user.type(input, 'coffee')
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByText('No amount found.')).toBeInTheDocument()
    await user.type(input, '{Enter}')
    expect(api.addTransaction).not.toHaveBeenCalled()
  })

  it('lets you correct the category, and remembers that choice as a rule', async () => {
    const { user, input, api } = await openQuickAdd()
    await user.type(input, 'suya 1500')
    await user.selectOptions(screen.getByLabelText(/Category/), 'Eating out')
    await user.type(input, '{Enter}')

    expect(api.addTransaction.mock.calls[0]?.[0]).toMatchObject({
      categoryId: 'cat-eating',
      note: 'suya',
    })
    expect(api.saveRule).toHaveBeenCalledWith('suya', 'cat-eating')
  })

  it('jumps to the field when "/" is pressed elsewhere on the page', async () => {
    const { user, input } = await openQuickAdd()
    await user.click(document.body)
    await user.keyboard('/')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('') // the slash was a shortcut, not typed text
  })
})
