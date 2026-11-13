import { describe, expect, it } from 'vitest'
import { filterRows, rowsToTsv, sortRows, statsOf, toRows, type SheetRow } from './sheet'

const row = (over: Partial<SheetRow>): SheetRow => ({
  id: 'x',
  date: '2026-10-14',
  kind: 'expense',
  category: 'Transport',
  note: 'bolt',
  title: 'bolt',
  amountMinor: 100,
  ...over,
})
const rows: SheetRow[] = [
  row({ id: 'a', note: 'bolt', amountMinor: 250_000 }),
  row({ id: 'b', note: 'lunch', category: 'Eating out', amountMinor: 450_000 }),
  row({
    id: 'c',
    note: 'salary',
    category: 'Salary',
    kind: 'income',
    amountMinor: 50_000_000,
    date: '2026-10-10',
  }),
]

describe('toRows', () => {
  it('names the category and gives empty notes a readable title', () => {
    const result = toRows(
      [
        {
          id: '1',
          amountMinor: 5,
          kind: 'income',
          categoryId: null,
          note: '',
          occurredOn: '2026-10-01',
        },
      ],
      [],
    )
    expect(result[0]).toMatchObject({ category: 'Uncategorised', title: 'Income' })
  })
})

describe('filterRows', () => {
  it('searches note, category and date, ignoring case', () => {
    expect(filterRows(rows, { query: 'BOLT', kind: 'all' }).map((r) => r.id)).toEqual(['a'])
    expect(filterRows(rows, { query: 'eating', kind: 'all' }).map((r) => r.id)).toEqual(['b'])
    expect(filterRows(rows, { query: '2026-10-10', kind: 'all' }).map((r) => r.id)).toEqual(['c'])
  })

  it('filters by type, and combines with search', () => {
    expect(filterRows(rows, { query: '', kind: 'income' }).map((r) => r.id)).toEqual(['c'])
    expect(filterRows(rows, { query: 'bolt', kind: 'income' })).toEqual([])
  })
})

describe('sortRows', () => {
  it('sorts by amount both ways', () => {
    expect(sortRows(rows, 'amount', 'asc').map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(sortRows(rows, 'amount', 'desc').map((r) => r.id)).toEqual(['c', 'b', 'a'])
  })

  it('sorts text and dates, and keeps ties in their original order', () => {
    expect(sortRows(rows, 'note', 'asc').map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(sortRows(rows, 'date', 'asc').map((r) => r.id)).toEqual(['c', 'a', 'b']) // a and b tie
    expect(sortRows(rows, 'category', 'asc').map((r) => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not change the original list', () => {
    const copy = [...rows]
    sortRows(rows, 'amount', 'desc')
    expect(rows).toEqual(copy)
  })
})

describe('statsOf', () => {
  it('adds up money in, out, net and the average entry', () => {
    expect(statsOf(rows)).toEqual({
      count: 3,
      income: 50_000_000,
      expense: 700_000,
      net: 49_300_000,
      average: 16_900_000,
    })
  })

  it('is all zeros for no rows', () => {
    expect(statsOf([])).toEqual({ count: 0, income: 0, expense: 0, net: 0, average: 0 })
  })
})

describe('rowsToTsv', () => {
  it('writes a header, decimal amounts, and neutralises formulas and stray tabs', () => {
    const text = rowsToTsv([row({ note: '=SUM(1)\tx', amountMinor: 250_050 })])
    expect(text).toBe(
      "Date\tType\tCategory\tNote\tAmount (NGN)\n2026-10-14\texpense\tTransport\t'=SUM(1) x\t2500.50",
    )
  })
})
