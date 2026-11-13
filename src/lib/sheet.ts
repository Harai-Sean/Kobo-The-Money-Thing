import { spreadsheetSafe, koboToDecimal } from './csv/csv'
import type { IsoDate } from './dates/dates'
import type { Category, Transaction, TxnKind } from '../features/transactions/types'

/** One line of the spreadsheet page: an entry with its category already turned into a name. */
export interface SheetRow {
  id: string
  date: IsoDate
  kind: TxnKind
  category: string
  note: string
  title: string // what to show when the note is empty
  amountMinor: number
}

export type SortKey = 'date' | 'category' | 'note' | 'amount'
export type SortDir = 'asc' | 'desc'
export type KindFilter = 'all' | TxnKind

export function toRows(
  transactions: readonly Transaction[],
  categories: readonly Category[],
): SheetRow[] {
  return transactions.map((t) => ({
    id: t.id,
    date: t.occurredOn,
    kind: t.kind,
    category: categories.find((c) => c.id === t.categoryId)?.name ?? 'Uncategorised',
    note: t.note,
    title: t.note || (t.kind === 'income' ? 'Income' : 'Expense'),
    amountMinor: t.amountMinor,
  }))
}

export function filterRows(
  rows: readonly SheetRow[],
  filter: { query: string; kind: KindFilter },
): SheetRow[] {
  const query = filter.query.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (filter.kind === 'all' || r.kind === filter.kind) &&
      (query === '' ||
        [r.note, r.category, r.date].some((text) => text.toLowerCase().includes(query))),
  )
}

/** A stable sort: rows that tie keep the newest-first order they came in. */
export function sortRows(rows: readonly SheetRow[], key: SortKey, dir: SortDir): SheetRow[] {
  const sign = dir === 'asc' ? 1 : -1
  const compare = (a: SheetRow, b: SheetRow): number => {
    if (key === 'amount') return a.amountMinor - b.amountMinor
    if (key === 'date') return a.date.localeCompare(b.date)
    return a[key].localeCompare(b[key])
  }
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
    .map(({ row }) => row)
}

export interface Stats {
  count: number
  income: number
  expense: number
  net: number
  average: number // average size of an entry, in kobo
}

/** The "status bar" maths: all integer kobo, so there is never a rounding drift. */
export function statsOf(rows: readonly SheetRow[]): Stats {
  let income = 0
  let expense = 0
  for (const r of rows) {
    if (r.kind === 'income') income += r.amountMinor
    else expense += r.amountMinor
  }
  const count = rows.length
  return {
    count,
    income,
    expense,
    net: income - expense,
    average: count === 0 ? 0 : Math.round((income + expense) / count),
  }
}

/** Tab-separated text: paste it straight into Excel or Google Sheets and it lands in cells. */
export function rowsToTsv(rows: readonly SheetRow[]): string {
  const cell = (text: string) => spreadsheetSafe(text).replace(/[\t\r\n]+/g, ' ')
  const lines = rows.map((r) =>
    [r.date, r.kind, r.category, r.note, koboToDecimal(r.amountMinor)].map(cell).join('\t'),
  )
  return ['Date\tType\tCategory\tNote\tAmount (NGN)', ...lines].join('\n')
}
