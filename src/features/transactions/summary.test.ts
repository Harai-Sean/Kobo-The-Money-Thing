import { describe, expect, it } from 'vitest'
import { changeVersusLast, groupByDay, summarize } from './summary'
import type { Category, Transaction } from './types'

const categories: Category[] = [
  { id: 'transport', name: 'Transport', kind: 'expense', color: '#000' },
  { id: 'eating', name: 'Eating out', kind: 'expense', color: '#000' },
]
const tx = (over: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  amountMinor: 100,
  kind: 'expense',
  categoryId: null,
  note: '',
  occurredOn: '2026-10-14',
  ...over,
})

describe('summarize', () => {
  it('totals money in, money out and net', () => {
    const result = summarize(
      [
        tx({ amountMinor: 250_000, categoryId: 'transport' }),
        tx({ amountMinor: 450_000, categoryId: 'eating' }),
        tx({ kind: 'income', amountMinor: 50_000_000 }),
      ],
      categories,
    )
    expect([result.income, result.expense, result.net]).toEqual([50_000_000, 700_000, 49_300_000])
  })

  it('ranks categories by spending with percentages that add to 100', () => {
    const result = summarize(
      [
        tx({ amountMinor: 250_000, categoryId: 'transport' }),
        tx({ amountMinor: 450_000, categoryId: 'eating' }),
      ],
      categories,
    )
    expect(result.categories.map((c) => [c.name, c.percent])).toEqual([
      ['Eating out', 64],
      ['Transport', 36],
    ])
  })

  it('groups uncategorised and unknown categories together and ignores income in the shares', () => {
    const result = summarize(
      [
        tx({ amountMinor: 100, categoryId: null }),
        tx({ amountMinor: 100, categoryId: 'deleted-one' }),
        tx({ kind: 'income', amountMinor: 999 }),
      ],
      categories,
    )
    expect(result.categories.map((c) => c.name)).toEqual(['Uncategorised', 'Uncategorised'])
  })

  it('handles an empty month', () => {
    expect(summarize([], categories)).toEqual({ income: 0, expense: 0, net: 0, categories: [] })
  })
})

describe('changeVersusLast', () => {
  it.each([
    [700, 100, 600],
    [50, 100, -50],
    [100, 100, 0],
    [1, 3, -66.7],
    [5, 0, null],
  ])('%i vs %i = %s', (current, last, expected) => {
    expect(changeVersusLast(current, last)).toBe(expected)
  })
})

describe('groupByDay', () => {
  it('groups by date, newest first, with daily spending', () => {
    const groups = groupByDay([
      tx({ occurredOn: '2026-10-10', kind: 'income', amountMinor: 900 }),
      tx({ occurredOn: '2026-10-14', amountMinor: 200 }),
      tx({ occurredOn: '2026-10-14', amountMinor: 300 }),
    ])
    expect(groups.map((g) => [g.date, g.items.length, g.spent])).toEqual([
      ['2026-10-14', 2, 500],
      ['2026-10-10', 1, 0],
    ])
  })
})
