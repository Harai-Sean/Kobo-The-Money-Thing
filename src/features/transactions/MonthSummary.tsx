import { CountUp } from '../../components/CountUp'
import { addMonths, formatMonth, type MonthKey } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import { Donut } from './Donut'
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
    <section aria-label="Month summary" className="space-y-6">
      <div className="on-dark rounded-sm bg-deep p-5 text-white">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2">
            <dt className="text-sm text-white/75">Money out</dt>
            <dd className="font-display text-5xl font-bold tabular-nums text-lime">
              <CountUp value={totals.expense} format={formatNaira} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-white/75">Money in</dt>
            <dd className="text-xl font-semibold tabular-nums">
              <CountUp value={totals.income} format={formatNaira} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-white/75">Net</dt>
            <dd className="text-xl font-semibold tabular-nums">
              <CountUp value={totals.net} format={formatNaira} />
            </dd>
          </div>
        </dl>
        {/* Neutral on purpose: spending going up is information, not a victory. */}
        <p className="mt-5 border-t border-white/20 pt-3 text-sm text-white/75">
          {change === null
            ? `No spending in ${formatMonth(previousMonth)} to compare with.`
            : `Spending is ${change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'}${change === 0 ? '' : ` ${Math.abs(change)}%`} compared with ${formatMonth(previousMonth)}.`}
        </p>
      </div>

      {totals.categories.length > 0 && (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Donut slices={totals.categories} />
          <div className="w-full">
            <h3 className="font-display text-xl font-bold">Where it went</h3>
            <ul className="mt-3 space-y-3">
              {totals.categories.map((c) => (
                <li key={c.categoryId ?? 'none'}>
                  {/* The text carries the meaning; colour and bar are extra, never the only signal. */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="tabular-nums">
                      {c.percent}% · {formatNaira(c.total)}
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-1 h-1.5 bg-ink/10">
                    <div
                      className="h-1.5 origin-left animate-grow"
                      style={{ width: `${c.percent}%`, background: c.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
