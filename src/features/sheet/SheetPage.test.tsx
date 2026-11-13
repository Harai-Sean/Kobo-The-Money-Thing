import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../transactions/types'
import { createFakeAuth, signedInSession } from '../../test/fakeAuth'
import { createFakeTransactionsApi } from '../../test/fakeTransactionsApi'
import { renderApp } from '../../test/render'

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
    note: '=SUM(1)',
    occurredOn: '2026-10-13',
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
    note: 'old bolt',
    occurredOn: '2026-09-20',
  },
]

async function openSheet() {
  const utils = renderApp(
    '/sheet',
    createFakeAuth(signedInSession),
    createFakeTransactionsApi(seed),
  )
  const table = await screen.findByRole('table')
  return { ...utils, table }
}
const dataRows = (table: HTMLElement) => within(table).getAllByRole('row').slice(1, -1) // without header and footer

describe('SheetPage', () => {
  it('shows one row per entry this month, with totals underneath', async () => {
    const { table } = await openSheet()
    expect(dataRows(table)).toHaveLength(3)
    expect(within(table).getByText(/Shown: 3 rows · In ₦500,000 · Out ₦7,000/)).toBeInTheDocument()
    expect(within(table).getByText('Net ₦493,000')).toBeInTheDocument()
  })

  it('is reachable from the header', async () => {
    const { user } = renderApp(
      '/',
      createFakeAuth(signedInSession),
      createFakeTransactionsApi(seed),
    )
    await user.click(await screen.findByRole('link', { name: 'Sheet' }))
    expect(await screen.findByRole('heading', { name: 'Sheet' })).toBeInTheDocument()
  })

  it('searches and filters by type, updating the totals', async () => {
    const { user, table } = await openSheet()
    await user.type(screen.getByLabelText('Search entries'), 'bolt')
    expect(dataRows(table)).toHaveLength(1)
    expect(within(table).getByText(/Shown: 1 row · In ₦0 · Out ₦2,500/)).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search entries'))
    await user.selectOptions(screen.getByLabelText('Type'), 'income')
    expect(dataRows(screen.getByRole('table'))).toHaveLength(1)

    await user.type(screen.getByLabelText('Search entries'), 'nothing-matches')
    expect(await screen.findByText('No entries match your search.')).toBeInTheDocument()
  })

  it('sorts by amount, flipping direction on a second click', async () => {
    const { user, table } = await openSheet()
    await user.click(within(table).getByRole('button', { name: /Amount/ }))
    expect(within(table).getByRole('columnheader', { name: /Amount/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(within(dataRows(table)[0]!).getByText('₦2,500')).toBeInTheDocument()

    await user.click(within(table).getByRole('button', { name: /Amount/ }))
    expect(within(table).getByRole('columnheader', { name: /Amount/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(within(dataRows(table)[0]!).getByText('+₦500,000')).toBeInTheDocument()
  })

  it('adds up the rows you tick', async () => {
    const { user } = await openSheet()
    await user.click(screen.getByRole('checkbox', { name: 'Select bolt, 2026-10-14' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select =SUM(1), 2026-10-13' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 selected · In ₦0 · Out ₦7,000 · Net -₦7,000 · Average ₦3,500',
    )
  })

  it('selects a range with shift-click, and everything with Select all', async () => {
    const { user } = await openSheet()
    await user.click(screen.getByRole('checkbox', { name: 'Select bolt, 2026-10-14' }))
    await user.keyboard('{Shift>}')
    await user.click(screen.getByRole('checkbox', { name: 'Select salary, 2026-10-10' }))
    await user.keyboard('{/Shift}')
    expect(screen.getByRole('status')).toHaveTextContent('3 selected')

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' })) // all are ticked, so this clears
    expect(screen.getByRole('status')).toHaveTextContent('Tick rows to add them up')
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }))
    expect(screen.getByRole('status')).toHaveTextContent('3 selected')
  })

  it('copies the table as tab-separated text that cannot run formulas', async () => {
    const writeText = vi.fn(async (_text: string) => {})
    const { user } = await openSheet()
    // Installed AFTER userEvent.setup() (inside openSheet), which would otherwise replace it.
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Copy table' }))

    const text = writeText.mock.calls[0]?.[0] ?? ''
    expect(text.split('\n')[0]).toBe('Date\tType\tCategory\tNote\tAmount (NGN)')
    expect(text).toContain("'=SUM(1)") // the formula is defused
    expect(await screen.findByText('Copied 3 rows.')).toBeInTheDocument()
  })

  it('switches month and clears the selection', async () => {
    const { user } = await openSheet()
    await user.click(screen.getByRole('checkbox', { name: 'Select bolt, 2026-10-14' }))
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    const table = await screen.findByRole('table')
    expect(dataRows(table)).toHaveLength(1)
    expect(within(table).getByText('old bolt')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tick rows to add them up')
  })
})
