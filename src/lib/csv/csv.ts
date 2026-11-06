import type { Category, Transaction } from '../../features/transactions/types'

/**
 * Makes one value safe to put in a CSV file.
 * SECURITY: a spreadsheet runs any cell that starts with = + - @ as a formula (for example a
 * note typed as =HYPERLINK(...)). We prefix such cells with an apostrophe so they stay plain text.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/** 150050 kobo -> "1500.50". Integer maths only. */
export function koboToDecimal(kobo: number): string {
  return `${Math.floor(kobo / 100)}.${String(kobo % 100).padStart(2, '0')}`
}

export function transactionsToCsv(
  transactions: readonly Transaction[],
  categories: readonly Category[],
): string {
  const nameOf = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Uncategorised'
  const rows = transactions.map((t) =>
    [t.occurredOn, t.kind, nameOf(t.categoryId), t.note, koboToDecimal(t.amountMinor)]
      .map(csvCell)
      .join(','),
  )
  // The leading BOM makes Excel read the file as UTF-8, so accents and symbols survive.
  return `\uFEFF${['date,type,category,note,amount_ngn', ...rows].join('\r\n')}\r\n`
}
