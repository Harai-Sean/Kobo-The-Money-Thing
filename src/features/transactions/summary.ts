import type { IsoDate } from '../../lib/dates/dates'
import { sharePercentages } from '../../lib/money/money'
import type { Category, Transaction } from './types'

export interface CategoryShare {
  categoryId: string | null
  name: string
  color: string
  total: number
  percent: number
}

const UNCATEGORISED_COLOR = '#8a948e'
export interface MonthTotals {
  income: number
  expense: number
  net: number
  categories: CategoryShare[]
}

/** Totals for a month, plus each expense category's share of spending. Integer kobo throughout. */
export function summarize(
  transactions: readonly Transaction[],
  categories: readonly Category[],
): MonthTotals {
  let income = 0
  let expense = 0
  const perCategory = new Map<string | null, number>()
  for (const t of transactions) {
    if (t.kind === 'income') {
      income += t.amountMinor
    } else {
      expense += t.amountMinor
      perCategory.set(t.categoryId, (perCategory.get(t.categoryId) ?? 0) + t.amountMinor)
    }
  }
  const rows = [...perCategory.entries()]
    .map(([categoryId, total]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        total,
        name: category?.name ?? 'Uncategorised',
        color: category?.color ?? UNCATEGORISED_COLOR,
      }
    })
    .sort((a, b) => b.total - a.total)
  const percents = sharePercentages(rows.map((r) => r.total))
  return {
    income,
    expense,
    net: income - expense,
    categories: rows.map((r, i) => ({ ...r, percent: percents[i] ?? 0 })),
  }
}

/** Percent change from last month to this month, to one decimal. Null when there is nothing to compare. */
export function changeVersusLast(current: number, last: number): number | null {
  return last === 0 ? null : Math.round(((current - last) / last) * 1000) / 10
}

export interface DayGroup {
  date: IsoDate
  items: Transaction[]
  spent: number
}

/** Groups entries by day (newest day first) with each day's spending total. */
export function groupByDay(transactions: readonly Transaction[]): DayGroup[] {
  const groups = new Map<IsoDate, DayGroup>()
  for (const t of transactions) {
    const group = groups.get(t.occurredOn) ?? { date: t.occurredOn, items: [], spent: 0 }
    group.items.push(t)
    if (t.kind === 'expense') group.spent += t.amountMinor
    groups.set(t.occurredOn, group)
  }
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date))
}
