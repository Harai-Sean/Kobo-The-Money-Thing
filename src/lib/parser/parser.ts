import { MAX_KOBO, nairaToKobo } from '../money/money'
import {
  addDays,
  isAfter,
  isIsoDate,
  mostRecentWeekday,
  toIsoDate,
  type IsoDate,
} from '../dates/dates'

/**
 * The quick-add parser: turns "bolt 2.5k yesterday" into structured data.
 *
 * It is a PURE function: no clock, no network, no randomness. Everything it needs (including
 * today's date) is passed in, so tests are exact. It never throws and never silently drops
 * text: anything it does not understand stays in the note, and problems become warnings
 * that the preview chips can show.
 */

export type TxnKind = 'expense' | 'income'
export interface ParserCategory {
  id: string
  name: string
  kind: TxnKind
}
export interface ParserRule {
  keyword: string
  categoryId: string
}

export interface ParseContext {
  today: IsoDate
  categories: readonly ParserCategory[]
  rules: readonly ParserRule[]
  /** word -> category id, learned from the user's past entries (optional). */
  history?: Readonly<Record<string, string>>
}

export type WarningCode =
  | 'missing-amount'
  | 'invalid-amount'
  | 'multiple-amounts'
  | 'future-date'
  | 'invalid-date'
  | 'note-truncated'

export interface ParseResult {
  amountMinor: number | null
  kind: TxnKind
  categoryId: string | null
  categorySource: 'rule' | 'name' | 'history' | null
  occurredOn: IsoDate
  note: string
  /** The word to remember if the user corrects the category (becomes a saved rule). */
  keyword: string | null
  warnings: { code: WarningCode; message: string }[]
}

export const MAX_NOTE_LENGTH = 200

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}
const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

// "1500", "1,500.5", "5k", "1.5m", "₦4500", "ngn2000", "n500" (prefix and suffix optional)
const AMOUNT_TOKEN = /^(₦|ngn|n)?(\d[\d,]*(?:\.\d+)?)([km])?$/i
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/
const DAY = /^\d{1,2}$/

/** Day + month with no year: use this year, or last year if that would be in the future. */
function resolveDayMonth(day: number, month: number, today: IsoDate): IsoDate | null {
  const year = Number(today.slice(0, 4))
  const thisYear = toIsoDate(year, month, day)
  if (!thisYear) return null
  return isAfter(thisYear, today) ? (toIsoDate(year - 1, month, day) ?? thisYear) : thisYear
}

function readAmount(token: string): { kobo: number | null; explicit: boolean } | null {
  const match = AMOUNT_TOKEN.exec(token)
  if (!match) return null
  const [, prefix, base = '', suffix] = match
  const explicit = Boolean(prefix || suffix || base.includes(',') || base.includes('.'))
  const baseKobo = nairaToKobo(base)
  if (baseKobo === null) return { kobo: null, explicit }
  if (!suffix) return { kobo: baseKobo, explicit }
  const kobo = baseKobo * (suffix.toLowerCase() === 'k' ? 1_000 : 1_000_000)
  return { kobo: kobo <= MAX_KOBO ? kobo : null, explicit }
}

const normalise = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

export function parse(text: string, ctx: ParseContext): ParseResult {
  const warnings: ParseResult['warnings'] = []
  const words = text.trim().split(/\s+/).filter(Boolean)
  const used = words.map(() => false)
  let kind: TxnKind = 'expense'

  // 1. Kind: "+salary" or "+500k" or the word "income" means income.
  words.forEach((word, i) => {
    if (word.startsWith('+')) {
      kind = 'income'
      words[i] = word.slice(1)
      if (words[i] === '') used[i] = true
    } else if (word.toLowerCase() === 'income') {
      kind = 'income'
      used[i] = true
    }
  })

  // 2. Date: the first date-like thing wins; later ones stay in the note.
  let occurredOn = ctx.today
  let dateFound = false
  const setDate = (date: IsoDate) => {
    occurredOn = date
    dateFound = true
    if (isAfter(date, ctx.today)) {
      warnings.push({ code: 'future-date', message: 'That date is in the future.' })
    }
  }
  for (let i = 0; i < words.length && !dateFound; i++) {
    if (used[i]) continue
    const word = words[i] ?? ''
    const lower = word.toLowerCase()
    const next = words[i + 1] ?? ''
    const nextLower = next.toLowerCase()

    if (lower === 'today') {
      setDate(ctx.today)
      used[i] = true
    } else if (lower === 'yesterday') {
      setDate(addDays(ctx.today, -1))
      used[i] = true
    } else if (lower in WEEKDAYS) {
      setDate(mostRecentWeekday(ctx.today, WEEKDAYS[lower] ?? 0))
      used[i] = true
    } else if (isIsoDate(word)) {
      setDate(word)
      used[i] = true
    } else if (SLASH_DATE.test(word)) {
      const [, d = '', m = '', y] = SLASH_DATE.exec(word) ?? []
      const year = y === undefined ? null : y.length === 2 ? 2000 + Number(y) : Number(y)
      const date =
        year === null
          ? resolveDayMonth(Number(d), Number(m), ctx.today)
          : toIsoDate(year, Number(m), Number(d))
      if (date) {
        setDate(date)
        used[i] = true
      } else warnings.push({ code: 'invalid-date', message: `"${word}" is not a real date.` })
    } else if (DAY.test(word) && nextLower in MONTHS && !used[i + 1]) {
      const date = resolveDayMonth(Number(word), MONTHS[nextLower] ?? 1, ctx.today)
      if (date) {
        setDate(date)
        used[i] = true
        used[i + 1] = true
      } else
        warnings.push({ code: 'invalid-date', message: `"${word} ${next}" is not a real date.` })
    } else if (lower in MONTHS && DAY.test(next) && !used[i + 1]) {
      const date = resolveDayMonth(Number(next), MONTHS[lower] ?? 1, ctx.today)
      if (date) {
        setDate(date)
        used[i] = true
        used[i + 1] = true
      } else
        warnings.push({ code: 'invalid-date', message: `"${word} ${next}" is not a real date.` })
    }
  }

  // 3. Amount. Prefer a number with a clear marker (₦, k, m, comma, decimal) over a bare one.
  const candidates: { index: number; kobo: number | null; explicit: boolean }[] = []
  words.forEach((word, i) => {
    if (used[i]) return
    const amount = readAmount(word)
    if (amount) candidates.push({ index: i, ...amount })
  })
  const explicitOnes = candidates.filter((c) => c.explicit)
  const chosen = explicitOnes.length === 1 ? explicitOnes[0] : candidates[0]
  if (candidates.length > 1) {
    warnings.push({
      code: 'multiple-amounts',
      message: 'More than one number found. Check the amount.',
    })
  }
  let amountMinor: number | null = null
  if (!chosen) {
    warnings.push({ code: 'missing-amount', message: 'No amount found.' })
  } else if (chosen.kobo === null) {
    warnings.push({
      code: 'invalid-amount',
      message: 'That amount is not valid (max 2 decimals, up to ₦1 billion).',
    })
  } else {
    amountMinor = chosen.kobo
    used[chosen.index] = true
    // A currency word just before the number ("ngn 2,000", "₦ 500") belongs to the amount.
    const before = (words[chosen.index - 1] ?? '').toLowerCase()
    if (chosen.index > 0 && (before === '₦' || before === 'ngn')) used[chosen.index - 1] = true
  }

  // 4. Note and category: everything not consumed above.
  let note = words.filter((_, i) => !used[i]).join(' ')
  if (note.length > MAX_NOTE_LENGTH) {
    note = note.slice(0, MAX_NOTE_LENGTH).trimEnd()
    warnings.push({
      code: 'note-truncated',
      message: `Note shortened to ${MAX_NOTE_LENGTH} characters.`,
    })
  }
  const noteWords = note.split(/\s+/).map(normalise).filter(Boolean)
  const byId = new Map(ctx.categories.map((c) => [c.id, c]))

  let categoryId: string | null = null
  let categorySource: ParseResult['categorySource'] = null
  let matchedWord: string | null = null
  const accept = (id: string | undefined, source: 'rule' | 'name' | 'history', word: string) => {
    const category = id ? byId.get(id) : undefined
    if (category && category.kind === kind) {
      categoryId = category.id
      categorySource = source
      matchedWord = word
      return true
    }
    return false
  }
  // Priority: the user's saved rules, then category names, then past behaviour.
  const found =
    noteWords.some((w) => accept(ctx.rules.find((r) => r.keyword === w)?.categoryId, 'rule', w)) ||
    noteWords.some(
      (w) =>
        w.length >= 3 &&
        accept(
          ctx.categories.find(
            (c) =>
              c.kind === kind && (c.name.toLowerCase() === w || c.name.toLowerCase().startsWith(w)),
          )?.id,
          'name',
          w,
        ),
    ) ||
    noteWords.some((w) => accept(ctx.history?.[w], 'history', w))
  void found

  const firstWord = noteWords[0]
  const keyword = matchedWord ?? (firstWord && firstWord.length >= 2 ? firstWord : null)

  return { amountMinor, kind, categoryId, categorySource, occurredOn, note, keyword, warnings }
}
