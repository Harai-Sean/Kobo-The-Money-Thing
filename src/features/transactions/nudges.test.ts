import { describe, expect, it } from 'vitest'
import { pickNudge } from './nudges'
import type { CategoryShare, MonthTotals } from './summary'

const share = (id: string, name: string, total: number, percent = 0): CategoryShare => ({
  categoryId: id,
  name,
  color: '#000',
  total,
  percent,
})
const totals = (categories: CategoryShare[]): MonthTotals => {
  const expense = categories.reduce((s, c) => s + c.total, 0)
  return { income: 0, expense, net: -expense, categories }
}

describe('pickNudge', () => {
  it('teases about eating out when it jumps 30% or more', () => {
    const nudge = pickNudge(
      totals([share('e', 'Eating out', 650_000)]),
      totals([share('e', 'Eating out', 400_000)]),
      '2026-10',
    )
    expect(nudge?.text).toMatch(/eat out less yo|kitchen misses you|looking questionable/)
    expect(nudge?.emoji).not.toBe('')
  })

  it('stays quiet for small spending, small changes and no history', () => {
    expect(
      pickNudge(
        totals([share('e', 'Eating out', 200_000)]),
        totals([share('e', 'Eating out', 50_000)]),
        '2026-10',
      ),
    ).toBeNull()
    expect(
      pickNudge(
        totals([share('e', 'Eating out', 500_000)]),
        totals([share('e', 'Eating out', 450_000)]),
        '2026-10',
      ),
    ).toBeNull()
    expect(pickNudge(totals([share('e', 'Eating out', 500_000)]), null, '2026-10')).toBeNull()
  })

  it.each([
    'Rent and housing',
    'Food and groceries',
    'Health',
    'Family support',
    'Education',
    'Utilities',
  ])('never jokes about %s', (name) => {
    expect(
      pickNudge(
        totals([share('x', name, 5_000_000)]),
        totals([share('x', name, 1_000_000)]),
        '2026-10',
      ),
    ).toBeNull()
  })

  it('comments on a very large share even without last month to compare', () => {
    const current = totals([share('s', 'Shopping', 900_000, 60), share('o', 'Other', 600_000, 40)])
    expect(pickNudge(current, null, '2026-10')?.text).toMatch(/60%/)
  })

  it('picks the biggest jump when several categories qualify', () => {
    const current = totals([share('e', 'Eating out', 600_000), share('t', 'Transport', 2_000_000)])
    const previous = totals([share('e', 'Eating out', 300_000), share('t', 'Transport', 1_000_000)])
    expect(pickNudge(current, previous, '2026-10')?.text).toMatch(/ride|transport|walk/i)
  })

  it('always chooses the same wording for the same month and category', () => {
    const current = totals([share('e', 'Eating out', 650_000)])
    const previous = totals([share('e', 'Eating out', 400_000)])
    expect(pickNudge(current, previous, '2026-10')).toEqual(pickNudge(current, previous, '2026-10'))
  })

  it('praises a real drop in spending', () => {
    const nudge = pickNudge(
      totals([share('f', 'Fees and charges', 100_000)]),
      totals([share('f', 'Fees and charges', 200_000)]),
      '2026-10',
    )
    expect(nudge).toEqual({ text: 'Spending is down 50% on last month. Look at you', emoji: '👏' })
  })
})
