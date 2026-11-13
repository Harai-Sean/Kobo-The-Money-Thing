import { describe, expect, it } from 'vitest'
import { MAX_NOTE_LENGTH, parse, type ParseContext } from './parser'

// A fixed "today" (a Wednesday) makes every date expectation exact.
const ctx: ParseContext = {
  today: '2026-10-07',
  categories: [
    { id: 'transport', name: 'Transport', kind: 'expense' },
    { id: 'airtime', name: 'Airtime and data', kind: 'expense' },
    { id: 'eating', name: 'Eating out', kind: 'expense' },
    { id: 'food', name: 'Food and groceries', kind: 'expense' },
    { id: 'rent', name: 'Rent and housing', kind: 'expense' },
    { id: 'salary', name: 'Salary', kind: 'income' },
    { id: 'other-income', name: 'Other income', kind: 'income' },
  ],
  rules: [
    { keyword: 'bolt', categoryId: 'transport' },
    { keyword: 'uber', categoryId: 'transport' },
    { keyword: 'mtn', categoryId: 'airtime' },
    { keyword: 'lunch', categoryId: 'eating' },
    { keyword: 'rent', categoryId: 'rent' },
    { keyword: 'salary', categoryId: 'salary' },
  ],
  history: { agege: 'transport' },
}
const p = (text: string) => parse(text, ctx)
const codes = (text: string) => p(text).warnings.map((w) => w.code)

describe('the examples from the PRD', () => {
  it.each([
    ['coffee 1500', 150_000, 'expense', null, '2026-10-07', 'coffee'],
    ['bolt 2.5k yesterday', 250_000, 'expense', 'transport', '2026-10-06', 'bolt'],
    ['+salary 500k', 50_000_000, 'income', 'salary', '2026-10-07', 'salary'],
    ['mtn data 3,000 mon', 300_000, 'expense', 'airtime', '2026-10-05', 'mtn data'],
    ['lunch ₦4500 3/10', 450_000, 'expense', 'eating', '2026-10-03', 'lunch'],
    ['rent 150000', 15_000_000, 'expense', 'rent', '2026-10-07', 'rent'],
  ])('%s', (text, amount, kind, category, date, note) => {
    const r = p(text)
    expect([r.amountMinor, r.kind, r.categoryId, r.occurredOn, r.note]).toEqual([
      amount,
      kind,
      category,
      date,
      note,
    ])
    expect(r.warnings).toEqual([])
  })
})

describe('amounts', () => {
  it.each([
    ['1500 coffee', 150_000],
    ['coffee 1,500', 150_000],
    ['coffee 5k', 500_000],
    ['coffee 1.5k', 150_000],
    ['coffee 2.5m', 250_000_000],
    ['coffee 5K', 500_000],
    ['coffee n500', 50_000],
    ['coffee NGN2000', 200_000],
    ['coffee ngn 2,000', 200_000],
    ['coffee ₦ 750', 75_000],
    ['coffee 0.50', 50],
  ])('%s -> %i kobo', (text, kobo) => {
    expect(p(text).amountMinor).toBe(kobo)
  })

  it('removes the currency word from the note when it sits before the number', () => {
    expect(p('coffee ngn 2,000').note).toBe('coffee')
  })

  it('reports a missing amount but keeps the text', () => {
    const r = p('coffee')
    expect(r.amountMinor).toBeNull()
    expect(r.note).toBe('coffee')
    expect(codes('coffee')).toEqual(['missing-amount'])
  })

  it('refuses invalid amounts instead of guessing, and keeps them visible', () => {
    const r = p('coffee 1500.555')
    expect(r.amountMinor).toBeNull()
    expect(r.note).toBe('coffee 1500.555')
    expect(r.warnings.map((w) => w.code)).toEqual(['invalid-amount'])
    expect(codes('coffee 2000m')).toEqual(['invalid-amount']) // above the ₦1 billion cap
  })

  it('prefers the number with a clear marker and warns about the others', () => {
    const r = p('dinner for 2 ₦8,000')
    expect(r.amountMinor).toBe(800_000)
    expect(r.note).toBe('dinner for 2')
    expect(r.warnings.map((w) => w.code)).toEqual(['multiple-amounts'])
  })

  it('takes the first bare number when none is marked, and warns', () => {
    const r = p('mtn 2 1500')
    expect(r.amountMinor).toBe(200)
    expect(r.warnings.map((w) => w.code)).toEqual(['multiple-amounts'])
  })
})

describe('shorthand amounts', () => {
  it.each([
    ['snacks 2h', 20_000], // 2 hundred
    ['snacks 2H', 20_000],
    ['snacks 1.5h', 15_000],
    ['snacks 10h', 100_000],
    ['snacks 2k', 200_000],
  ])('%s -> %i kobo', (text, kobo) => {
    expect(p(text).amountMinor).toBe(kobo)
  })
})

describe('income words', () => {
  it.each([
    ['add 5000', 'income', ''],
    ['added 5k tolu', 'income', 'tolu'],
    ['ADD 2h', 'income', ''],
    ['received 5k from tolu', 'income', 'received from tolu'], // hint words stay in the note
    ['refund 3k', 'income', 'refund'],
  ])('%s', (text, kind, note) => {
    const r = p(text)
    expect([r.kind, r.note]).toEqual([kind, note])
    expect(r.amountMinor).not.toBeNull()
  })

  it('works out income from a saved rule even without a plus sign', () => {
    expect(p('salary 500k')).toMatchObject({
      kind: 'income',
      categoryId: 'salary',
      categorySource: 'rule',
    })
  })

  it('does not let a rule override an explicit kind', () => {
    expect(p('+rent 5k')).toMatchObject({ kind: 'income', categoryId: null })
  })

  it('leaves ordinary expenses alone', () => {
    expect(p('bolt 2k').kind).toBe('expense')
    expect(p('address 2k').kind).toBe('expense') // "add" inside a longer word is not a marker
  })
})

describe('dates', () => {
  it.each([
    ['coffee 500 today', '2026-10-07'],
    ['coffee 500 yesterday', '2026-10-06'],
    ['coffee 500 YESTERDAY', '2026-10-06'],
    ['coffee 500 sat', '2026-10-03'],
    ['coffee 500 saturday', '2026-10-03'],
    ['coffee 500 wed', '2026-09-30'], // same weekday = last week
    ['coffee 500 3 oct', '2026-10-03'],
    ['coffee 500 oct 3', '2026-10-03'],
    ['coffee 500 3 October', '2026-10-03'],
    ['coffee 500 2026-10-03', '2026-10-03'],
    ['coffee 500 3/10', '2026-10-03'],
    ['coffee 500 3/10/2025', '2025-10-03'],
    ['coffee 500 3/10/25', '2025-10-03'],
    ['coffee 500 20/12', '2025-12-20'], // would be in the future, so last year
    ['3 oct coffee 500', '2026-10-03'], // order does not matter
  ])('%s -> %s', (text, date) => {
    const r = p(text)
    expect(r.occurredOn).toBe(date)
    expect(r.amountMinor).toBe(50_000) // the date digits never get mistaken for the amount
    expect(r.note).toBe('coffee')
  })

  it('flags impossible dates and leaves them in the note', () => {
    const r = p('coffee 500 31/02')
    expect(r.occurredOn).toBe('2026-10-07')
    expect(r.note).toBe('coffee 31/02')
    expect(r.warnings.map((w) => w.code)).toEqual(['invalid-date'])
  })

  it('flags future dates but still reads them', () => {
    const r = p('coffee 500 2026-12-01')
    expect(r.occurredOn).toBe('2026-12-01')
    expect(r.warnings.map((w) => w.code)).toEqual(['future-date'])
  })

  it('uses only the first date and keeps the second in the note', () => {
    const r = p('coffee 500 yesterday sat')
    expect(r.occurredOn).toBe('2026-10-06')
    expect(r.note).toBe('coffee sat')
  })
})

describe('kind', () => {
  it.each([
    ['+500k', 'income', ''],
    ['+salary 500k', 'income', 'salary'],
    ['income 200k', 'income', ''],
    ['salary 200k +', 'income', 'salary'],
  ])('%s', (text, kind, note) => {
    const r = p(text)
    expect(r.kind).toBe(kind)
    expect(r.note).toBe(note)
    expect(r.amountMinor).not.toBeNull()
  })
})

describe('categories', () => {
  it('matches the user rules first', () => {
    expect(p('uber 4200 work')).toMatchObject({
      categoryId: 'transport',
      categorySource: 'rule',
      note: 'uber work',
    })
  })

  it('then category names, including the start of a longer name', () => {
    expect(p('food 3k')).toMatchObject({ categoryId: 'food', categorySource: 'name' })
    expect(p('transport 2k')).toMatchObject({ categoryId: 'transport', categorySource: 'name' })
  })

  it('then past behaviour', () => {
    expect(p('agege 2k')).toMatchObject({ categoryId: 'transport', categorySource: 'history' })
  })

  it('never uses a category of the wrong kind', () => {
    expect(p('+rent 5k').categoryId).toBeNull() // "rent" is an expense category
    expect(p('+other 5k').categoryId).toBe('other-income')
  })

  it('leaves unknown words uncategorised and offers the first word as a rule keyword', () => {
    expect(p('coffee 1500')).toMatchObject({
      categoryId: null,
      categorySource: null,
      keyword: 'coffee',
    })
  })

  it('offers the matched word as the keyword', () => {
    expect(p('uber 4200 work').keyword).toBe('uber')
  })

  it('ignores punctuation when matching', () => {
    expect(p('Bolt, 2k').categoryId).toBe('transport')
  })
})

describe('robustness', () => {
  it('handles empty and whitespace input', () => {
    expect(p('').amountMinor).toBeNull()
    expect(p('   ').note).toBe('')
  })

  it('shortens very long notes with a warning', () => {
    const r = p(`coffee 500 ${'x'.repeat(300)}`)
    expect(r.note.length).toBeLessThanOrEqual(MAX_NOTE_LENGTH)
    expect(r.warnings.map((w) => w.code)).toContain('note-truncated')
  })

  it('never throws and never returns a bad amount, whatever is typed', () => {
    const pieces = [
      '2h',
      'add',
      'received',
      'coffee',
      '1500',
      '2.5k',
      '₦',
      'ngn',
      '+',
      '3/10',
      '31/02',
      'oct',
      '3',
      'mon',
      '',
      '😀',
      '1e9',
      '-5',
      '0',
      '.',
      ',',
      '9'.repeat(30),
      'yesterday',
      'N',
    ]
    let seed = 42
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
    for (let n = 0; n < 2000; n++) {
      const len = 1 + Math.floor(next() * 5)
      const text = Array.from(
        { length: len },
        () => pieces[Math.floor(next() * pieces.length)],
      ).join(' ')
      const r = p(text)
      if (r.amountMinor !== null) {
        expect(Number.isInteger(r.amountMinor)).toBe(true)
        expect(r.amountMinor).toBeGreaterThan(0)
        expect(r.amountMinor).toBeLessThanOrEqual(100_000_000_000)
      }
      expect(r.note.length).toBeLessThanOrEqual(MAX_NOTE_LENGTH)
    }
  })
})
