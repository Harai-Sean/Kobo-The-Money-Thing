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
    <section aria-label="Transactions" className="space-y-5">
      {undoable && (
        <p role="status" className="flex items-center gap-3 rounded-md bg-ink/5 p-3 text-sm">
          Entry deleted.
          <button
            type="button"
            className="font-medium underline"
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
          <h3 className="flex justify-between border-b border-ink/10 pb-1 text-sm font-semibold">
            <span>{formatDayHeading(group.date, today)}</span>
            {group.spent > 0 && (
              <span className="tabular-nums text-muted">Spent {formatNaira(group.spent)}</span>
            )}
          </h3>
          <ul>
            {group.items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate">{t.note || nameOf(t.categoryId)}</p>
                  <p className="text-sm text-muted">{nameOf(t.categoryId)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">
                    {t.kind === 'income' ? '+' : ''}
                    {formatNaira(t.amountMinor)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${t.note || nameOf(t.categoryId)} ${formatNaira(t.amountMinor)}`}
                    className="text-sm underline"
                    onClick={() => {
                      remove.mutate(t)
                      setUndoable(t)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
