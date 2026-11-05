/**
 * Calendar dates as plain "YYYY-MM-DD" text (an "ISO date").
 *
 * WHY NOT Date objects? `new Date("2026-10-01")` means midnight UTC, which in some time zones
 * is still September 30th on the wall clock. A transaction's day is a CALENDAR day, so we never
 * convert it through a timestamp. The only place a real Date is read is todayIso(), using the
 * device's LOCAL calendar. Date arithmetic below runs entirely in UTC, which has no daylight
 * saving or time-zone shifts, so it is exact everywhere.
 */

export type IsoDate = string // "2026-10-31"
export type MonthKey = string // "2026-10"

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** Builds "YYYY-MM-DD", or null if that day does not exist (like 31 February). */
export function toIsoDate(year: number, month: number, day: number): IsoDate | null {
  const check = new Date(Date.UTC(year, month - 1, day))
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  return valid && year >= 1000 ? `${pad(year, 4)}-${pad(month)}-${pad(day)}` : null
}

export function parseIsoDate(text: string): { year: number; month: number; day: number } | null {
  const match = ISO_PATTERN.exec(text)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  return toIsoDate(year, month, day) === text ? { year, month, day } : null
}

export const isIsoDate = (text: string): boolean => parseIsoDate(text) !== null

/** Today on the device's own calendar. `now` is injectable so tests are deterministic. */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function toUtc(iso: IsoDate): Date {
  const parts = parseIsoDate(iso)
  if (!parts) throw new Error(`Not a valid date: ${iso}`)
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
}

function fromUtc(date: Date): IsoDate {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtc(date)
}

/** 0 = Sunday ... 6 = Saturday. */
export const weekdayOf = (iso: IsoDate): number => toUtc(iso).getUTCDay()

/**
 * The most recent PAST occurrence of a weekday. Typing "mon" on a Monday means LAST Monday
 * (7 days ago); if you meant today you would type "today".
 */
export function mostRecentWeekday(today: IsoDate, weekday: number): IsoDate {
  const diff = (weekdayOf(today) - weekday + 7) % 7
  return addDays(today, -(diff === 0 ? 7 : diff))
}

// ISO dates sort correctly as plain text, so comparing strings is enough.
export const isBefore = (a: IsoDate, b: IsoDate): boolean => a < b
export const isAfter = (a: IsoDate, b: IsoDate): boolean => a > b

// ---- months

export const monthOf = (iso: IsoDate): MonthKey => iso.slice(0, 7)

function parseMonth(key: MonthKey): { year: number; month: number } {
  const match = MONTH_PATTERN.exec(key)
  const [year, month] = [Number(match?.[1]), Number(match?.[2])]
  if (!match || month < 1 || month > 12) throw new Error(`Not a valid month: ${key}`)
  return { year, month }
}

export function addMonths(key: MonthKey, months: number): MonthKey {
  const { year, month } = parseMonth(key)
  const index = year * 12 + (month - 1) + months
  return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`
}

/** First and last day of a month, for "all transactions in October" queries. */
export function monthRange(key: MonthKey): { from: IsoDate; to: IsoDate } {
  const { year, month } = parseMonth(key)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { from: `${key}-01`, to: `${key}-${pad(lastDay)}` }
}

export function formatMonth(key: MonthKey): string {
  const { year, month } = parseMonth(key)
  return `${MONTH_LONG[month - 1]} ${year}`
}

// ---- display

/** "Today", "Yesterday", otherwise "Mon 12 Oct" (adds the year if it is not this year). */
export function formatDayHeading(iso: IsoDate, today: IsoDate): string {
  if (iso === today) return 'Today'
  if (iso === addDays(today, -1)) return 'Yesterday'
  const { year, month, day } = parseIsoDate(iso) ?? { year: 0, month: 1, day: 1 }
  const base = `${WEEKDAYS[weekdayOf(iso)]} ${day} ${MONTH_SHORT[month - 1]}`
  return year === Number(today.slice(0, 4)) ? base : `${base} ${year}`
}
