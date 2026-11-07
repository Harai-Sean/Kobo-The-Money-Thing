import { useEffect, useState } from 'react'
import { formatDayHeading, todayIso, type MonthKey } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import { Button } from '../../components/ui/Button'
import {
  useCategories,
  useDeleteTransaction,
  useMonthTransactions,
  useRestoreTransaction,
} from './hooks'
import { categoryColor } from './colors'
import { groupByDay } from './summary'
import type { Transaction } from './types'

export function TransactionList({ month }: { month: MonthKey }) {
  const query = useMonthTransactions(month)
  const categories = useCategories().data ?? []
  const remove = useDeleteTransaction()
  const restore = useRestoreTransaction()
  const [undoable, setUndoable] = useState<Transaction | null>(null)

  // The "Undo" offer disappears by itself after 8 seconds.
  useEffect(() => {
    if (!undoable) return
    const timer = setTimeout(() => setUndoable(null), 8000)
    return () => clearTimeout(timer)
  }, [undoable])

  if (query.isPending)
    return (
      <p role="status" className="text-muted">
        Loading entries…
      </p>
    )
  if (query.isError) {
    return (
      <div role="alert" className="space-y-2">
        <p className="text-danger">Could not load your entries.</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    )
  }
  if (query.data.length === 0) {
    return (
      <p className="text-muted">
        Nothing here yet. Type something like “coffee 1500” above to add your first entry.
      </p>
    )
  }

  const today = todayIso()
  const nameOf = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Uncategorised'
  // An entry typed without any words still needs a readable title.
  const titleOf = (t: Transaction) => t.note || (t.kind === 'income' ? 'Income' : 'Expense')

  return (
    <section aria-label="Transactions" className="space-y-6">
      {undoable && (
        <p
          role="status"
          className="flex items-center gap-3 rounded-full bg-tint-violet px-5 py-3 text-sm font-semibold"
        >
          Entry deleted.
          <button
            type="button"
            className="underline"
            onClick={() => {
              restore.mutate(undoable)
              setUndoable(null)
            }}
          >
            Undo
          </button>
        </p>
      )}
      {groupByDay(query.data).map((group) => (
        <div key={group.date}>
          <h3 className="flex items-baseline justify-between border-b-2 border-ink pb-1 font-display text-xl font-extrabold tracking-tight">
            <span>{formatDayHeading(group.date, today)}</span>
            {group.spent > 0 && (
              <span className="font-sans text-sm font-medium tabular-nums text-muted">
                Spent {formatNaira(group.spent)}
              </span>
            )}
          </h3>
          <ul>
            {group.items.map((t, index) => (
              <li
                key={t.id}
                className="flex animate-rise items-center gap-3 py-1.5"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: categoryColor(categories, t.categoryId) }}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{titleOf(t)}</span>
                  <span className="text-sm text-muted">{nameOf(t.categoryId)}</span>
                </span>
                {/* The dotted leader, like a receipt: it leads the eye from the description to the amount. */}
                <span
                  aria-hidden="true"
                  className="min-w-3 flex-1 border-b-2 border-dotted border-line"
                />
                <span
                  className={`shrink-0 font-bold tabular-nums ${t.kind === 'income' ? 'text-leaf-ink' : ''}`}
                >
                  {t.kind === 'income' ? '+' : ''}
                  {formatNaira(t.amountMinor)}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${titleOf(t)} ${formatNaira(t.amountMinor)}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-xl text-muted hover:bg-tint-violet"
                  onClick={() => {
                    remove.mutate(t)
                    setUndoable(t)
                  }}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
