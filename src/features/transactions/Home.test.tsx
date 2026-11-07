import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeAuth, signedInSession } from '../../test/fakeAuth'
import { createFakeTransactionsApi } from '../../test/fakeTransactionsApi'
import { renderApp } from '../../test/render'
import type { Transaction } from './types'

// Freeze "today" so the month and the "Yesterday" label are the same on any day the tests run.
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 15, 12) }))
afterEach(() => vi.useRealTimers())

const seed: Transaction[] = [
  {
    id: 't1',
    amountMinor: 250_000,
    kind: 'expense',
    categoryId: 'cat-transport',
    note: 'bolt',
    occurredOn: '2026-10-14',
  },
  {
    id: 't2',
    amountMinor: 450_000,
    kind: 'expense',
    categoryId: 'cat-eating',
    note: 'lunch',
    occurredOn: '2026-10-14',
  },
  {
    id: 't3',
    amountMinor: 50_000_000,
    kind: 'income',
    categoryId: 'cat-salary',
    note: 'salary',
    occurredOn: '2026-10-10',
  },
  {
    id: 't4',
    amountMinor: 100_000,
    kind: 'expense',
    categoryId: 'cat-transport',
    note: 'bolt',
    occurredOn: '2026-09-20',
  },
]

function openHome(entries: Transaction[] = seed) {
  return renderApp('/', createFakeAuth(signedInSession), createFakeTransactionsApi(entries))
}

describe('Home: list', () => {
  it('groups entries by day with daily totals', async () => {
    openHome()
    const list = await screen.findByRole('region', { name: 'Transactions' })
    const headings = within(list)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(headings).toEqual(['YesterdaySpent ₦7,000', 'Sat 10 Oct'])
    expect(within(list).getByText('+₦500,000')).toBeInTheDocument()
  })

  it('gives an entry without a note a readable title instead of repeating the category', async () => {
    openHome([
      {
        id: 'n1',
        amountMinor: 100_000,
        kind: 'income',
        categoryId: null,
        note: '',
        occurredOn: '2026-10-14',
      },
      {
        id: 'n2',
        amountMinor: 50_000,
        kind: 'expense',
        categoryId: null,
        note: '',
        occurredOn: '2026-10-14',
      },
    ])
    expect(await screen.findByRole('button', { name: 'Delete Income ₦1,000' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Expense ₦500' })).toBeInTheDocument()
  })

  it('shows a friendly empty state', async () => {
    openHome([])
    expect(await screen.findByText(/Nothing here yet/)).toBeInTheDocument()
  })

  it('shows an error with a retry button when loading fails', async () => {
    const api = createFakeTransactionsApi(seed)
    api.listTransactions.mockRejectedValueOnce(new Error('network down'))
    renderApp('/', createFakeAuth(signedInSession), api)
    expect(await screen.findAllByText(/Could not load/)).not.toHaveLength(0)
  })

  it('deletes an entry and lets you undo it', async () => {
    const { user, api } = openHome()
    await user.click(await screen.findByRole('button', { name: 'Delete lunch ₦4,500' }))

    expect(screen.queryByRole('button', { name: 'Delete lunch ₦4,500' })).not.toBeInTheDocument()
    expect(api.deleteTransaction).toHaveBeenCalledWith('t2')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await screen.findByRole('button', { name: 'Delete lunch ₦4,500' })).toBeInTheDocument()
    expect(api.restoreTransaction).toHaveBeenCalledWith('t2')
  })

  it('shows a newly added entry straight away', async () => {
    const { user } = openHome()
    await user.type(await screen.findByRole('textbox', { name: 'Quick add' }), 'suya 1500{Enter}')
    const list = screen.getByRole('region', { name: 'Transactions' })
    expect(await within(list).findByText('suya')).toBeInTheDocument()
    expect(within(list).getByText('Today')).toBeInTheDocument()
  })
})

describe('Home: month summary', () => {
  it('shows totals, the comparison with last month and category shares', async () => {
    openHome()
    const summary = await screen.findByRole('region', { name: 'Month summary' })
    expect(
      await within(summary).findByText('Spending is up 600% compared with September 2026.'),
    ).toBeInTheDocument()
    expect(within(summary).getByText('₦500,000')).toBeInTheDocument() // money in
    expect(within(summary).getByText('₦7,000')).toBeInTheDocument() // money out
    expect(within(summary).getByText('₦493,000')).toBeInTheDocument() // net
    expect(within(summary).getByText('64% · ₦4,500')).toBeInTheDocument()
    expect(within(summary).getByText('36% · ₦2,500')).toBeInTheDocument()
  })

  it('switches months, and cannot go into the future', async () => {
    const { user } = openHome()
    expect(await screen.findByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: 'Month summary' })
    expect(await within(summary).findByText('₦1,000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled()
  })
})
