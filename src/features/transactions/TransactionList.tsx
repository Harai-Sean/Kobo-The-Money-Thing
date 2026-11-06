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

  return (
    <section aria-label="Transactions" className="space-y-6">
      {undoable && (
        <p role="status" className="flex items-center gap-3 rounded-sm bg-ink/5 p-3 text-sm">
          Entry deleted.
          <button
            type="button"
            className="font-semibold underline"
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
          <h3 className="flex items-baseline justify-between border-b-2 border-ink pb-1 font-display text-lg font-bold">
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
                className="flex animate-rise items-baseline gap-2 py-2"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span className="truncate font-medium">{t.note || nameOf(t.categoryId)}</span>
                <span className="shrink-0 text-sm text-muted">{nameOf(t.categoryId)}</span>
                {/* The dotted leader, like a receipt: it leads the eye from the description to the amount. */}
                <span
                  aria-hidden="true"
                  className="min-w-4 flex-1 translate-y-[-4px] border-b-2 border-dotted border-ink/30"
                />
                <span className="shrink-0 font-semibold tabular-nums">
                  {t.kind === 'income' ? '+' : ''}
                  {formatNaira(t.amountMinor)}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${t.note || nameOf(t.categoryId)} ${formatNaira(t.amountMinor)}`}
                  className="shrink-0 text-sm text-muted underline"
                  onClick={() => {
                    remove.mutate(t)
                    setUndoable(t)
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
