import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  formatDayHeading,
  formatMonth,
  isIsoDate,
  monthOf,
  monthRange,
  mostRecentWeekday,
  parseIsoDate,
  todayIso,
  toIsoDate,
  weekdayOf,
} from './dates'

describe('validation', () => {
  it.each(['2026-10-31', '2024-02-29', '2026-01-01'])('accepts %s', (text) => {
    expect(isIsoDate(text)).toBe(true)
  })

  it.each([
    '2026-02-30',
    '2026-13-01',
    '2025-02-29',
    '2026-1-1',
    '26-10-31',
    '2026/10/31',
    '',
    'yesterday',
  ])('rejects %j', (text) => {
    expect(isIsoDate(text)).toBe(false)
  })

  it('builds dates and refuses impossible ones', () => {
    expect(toIsoDate(2026, 10, 3)).toBe('2026-10-03')
    expect(toIsoDate(2026, 2, 31)).toBeNull()
    expect(parseIsoDate('2026-10-03')).toEqual({ year: 2026, month: 10, day: 3 })
  })
})

describe('todayIso', () => {
  it('uses the local calendar day, even late at night', () => {
    // Built from LOCAL parts, so this holds in every time zone. A toISOString()-based version
    // would fail here for anyone ahead of UTC just before midnight.
    expect(todayIso(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31')
    expect(todayIso(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01')
  })
})

describe('addDays', () => {
  it.each([
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2024-03-01', -1, '2024-02-29'], // leap year
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-10-04', 0, '2026-10-04'],
    ['2026-10-04', -35, '2026-08-30'],
  ])('%s + %i days = %s', (start, days, expected) => {
    expect(addDays(start, days)).toBe(expected)
  })

  it('throws on an invalid date instead of guessing', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow()
  })
})

describe('weekdays', () => {
  it('knows the day of the week', () => {
    expect(weekdayOf('2026-10-04')).toBe(0) // Sunday
    expect(weekdayOf('2026-10-05')).toBe(1) // Monday
  })

  it('finds the most recent past weekday', () => {
    // today = Wednesday 2026-10-07
    expect(mostRecentWeekday('2026-10-07', 1)).toBe('2026-10-05') // Mon
    expect(mostRecentWeekday('2026-10-07', 6)).toBe('2026-10-03') // Sat
    expect(mostRecentWeekday('2026-10-07', 0)).toBe('2026-10-04') // Sun
  })

  it('treats the same weekday as LAST week, not today', () => {
    expect(mostRecentWeekday('2026-10-07', 3)).toBe('2026-09-30')
  })
})

describe('months', () => {
  it('extracts and shifts month keys across year boundaries', () => {
    expect(monthOf('2026-10-31')).toBe('2026-10')
    expect(addMonths('2026-10', 1)).toBe('2026-11')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-10', -22)).toBe('2024-12')
  })

  it.each([
    ['2026-10', '2026-10-31'],
    ['2026-02', '2026-02-28'],
    ['2024-02', '2024-02-29'],
    ['2026-12', '2026-12-31'],
  ])('month %s ends on %s', (key, last) => {
    expect(monthRange(key)).toEqual({ from: `${key}-01`, to: last })
  })

  it('formats a month name and rejects bad keys', () => {
    expect(formatMonth('2026-10')).toBe('October 2026')
    expect(() => formatMonth('2026-13')).toThrow()
  })
})

describe('formatDayHeading', () => {
  const today = '2026-10-07'
  it.each([
    ['2026-10-07', 'Today'],
    ['2026-10-06', 'Yesterday'],
    ['2026-10-03', 'Sat 3 Oct'],
    ['2025-12-25', 'Thu 25 Dec 2025'],
  ])('%s shows as %s', (iso, expected) => {
    expect(formatDayHeading(iso, today)).toBe(expected)
  })
})
