import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '../../features/transactions/types'
import { csvCell, koboToDecimal, transactionsToCsv } from './csv'

describe('csvCell', () => {
  it.each([
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['two\nlines', '"two\nlines"'],
  ])('escapes %j', (input, expected) => {
    expect(csvCell(input)).toBe(expected)
  })

  it.each(['=1+1', '+5', '-5', '@SUM(A1)', '=HYPERLINK("http://evil","x")'])(
    'neutralises formula %j',
    (input) => {
      expect(csvCell(input).replaceAll('"', '').startsWith("'")).toBe(true)
    },
  )
})

describe('koboToDecimal', () => {
  it.each([
    [150_050, '1500.50'],
    [7, '0.07'],
    [100, '1.00'],
    [50_000_000, '500000.00'],
  ])('%i -> %s', (kobo, text) => {
    expect(koboToDecimal(kobo)).toBe(text)
  })
})

describe('transactionsToCsv', () => {
  const categories: Category[] = [{ id: 'c1', name: 'Transport', kind: 'expense', color: '#000' }]
  const rows: Transaction[] = [
    {
      id: '1',
      amountMinor: 250_000,
      kind: 'expense',
      categoryId: 'c1',
      note: 'bolt, home',
      occurredOn: '2026-10-14',
    },
    {
      id: '2',
      amountMinor: 100,
      kind: 'income',
      categoryId: null,
      note: '=evil()',
      occurredOn: '2026-10-10',
    },
  ]

  it('writes a header and one safe line per entry', () => {
    expect(transactionsToCsv(rows, categories)).toBe(
      '\uFEFFdate,type,category,note,amount_ngn\r\n' +
        '2026-10-14,expense,Transport,"bolt, home",2500.00\r\n' +
        "2026-10-10,income,Uncategorised,'=evil(),1.00\r\n",
    )
  })

  it('still writes the header for no entries', () => {
    expect(transactionsToCsv([], categories)).toBe('\uFEFFdate,type,category,note,amount_ngn\r\n')
  })
})
