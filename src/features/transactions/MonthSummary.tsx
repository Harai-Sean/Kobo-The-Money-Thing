import { addMonths, formatMonth, type MonthKey } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import { useCategories, useMonthTransactions } from './hooks'
import { changeVersusLast, summarize } from './summary'

export function MonthSummary({ month }: { month: MonthKey }) {
  const previousMonth = addMonths(month, -1)
  const current = useMonthTransactions(month)
  const previous = useMonthTransactions(previousMonth)
  const categories = useCategories().data ?? []

  if (current.isPending)
    return (
      <p role="status" className="text-muted">
        Loading summary…
      </p>
    )
  if (current.isError)
    return (
      <p role="alert" className="text-danger">
        Could not load this month.
      </p>
    )

  const totals = summarize(current.data, categories)
  const change = previous.data
    ? changeVersusLast(totals.expense, summarize(previous.data, categories).expense)
    : null

  return (
    <section
      aria-label="Month summary"
      className="space-y-4 rounded-lg border border-ink/10 bg-card p-4"
    >
      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-sm text-muted">Money in</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatNaira(totals.income)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Money out</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatNaira(totals.expense)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Net</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatNaira(totals.net)}</dd>
        </div>
      </dl>

      {/* Neutral on purpose: spending going up is information, not a victory. */}
      <p className="text-sm text-muted">
        {change === null
          ? `No spending in ${formatMonth(previousMonth)} to compare with.`
          : `Spending is ${change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'}${change === 0 ? '' : ` ${Math.abs(change)}%`} compared with ${formatMonth(previousMonth)}.`}
      </p>

      {totals.categories.length > 0 && (
        <div>
          <h3 className="font-semibold">Where it went</h3>
          <ul className="mt-2 space-y-3">
            {totals.categories.map((c) => (
              <li key={c.categoryId ?? 'none'}>
                {/* The text carries the meaning; the bar is decoration, so colour is never the only signal. */}
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="tabular-nums">
                    {c.percent}% · {formatNaira(c.total)}
                  </span>
                </div>
                <div aria-hidden="true" className="mt-1 h-2 rounded bg-ink/10">
                  <div className="h-2 rounded bg-brand" style={{ width: `${c.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
