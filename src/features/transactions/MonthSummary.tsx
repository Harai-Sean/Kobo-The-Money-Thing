import { CountUp } from '../../components/CountUp'
import { HeroShapes } from '../../components/ui/Shapes'
import { addMonths, formatMonth, type MonthKey } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import { Donut } from './Donut'
import { useCategories, useMonthTransactions } from './hooks'
import { changeVersusLast, summarize } from './summary'

// Long amounts get a smaller size so they never run off a phone screen.
function amountSize(text: string): string {
  if (text.length <= 7) return 'text-7xl'
  if (text.length <= 9) return 'text-6xl'
  if (text.length <= 11) return 'text-5xl'
  return 'text-4xl'
}

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
      <div className="relative flex min-h-72 flex-col overflow-hidden rounded-[2rem] border-2 border-ink bg-card p-6">
        <HeroShapes className="pointer-events-none absolute -right-5 -top-7 size-48" />
        <p className="relative text-sm font-semibold text-muted">Money out</p>
        <p
          className={`relative mt-auto font-display font-extrabold leading-none tracking-tighter tabular-nums ${amountSize(formatNaira(totals.expense))}`}
        >
          <CountUp value={totals.expense} format={formatNaira} />
        </p>
        <dl className="relative mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <div className="rounded-full bg-tint-leaf px-4 py-2">
            <dt className="inline">
              <span className="sr-only">Money in</span>
              <span aria-hidden="true">In </span>
            </dt>
            <dd className="inline tabular-nums">
              <CountUp value={totals.income} format={formatNaira} />
            </dd>
          </div>
          <div className="rounded-full bg-tint-blue px-4 py-2">
            <dt className="inline">Net </dt>
            <dd className="inline tabular-nums">
              <CountUp value={totals.net} format={formatNaira} />
            </dd>
          </div>
        </dl>
      </div>

      {/* Neutral on purpose: spending going up is information, not a victory. */}
      <p className="flex items-center gap-3 text-sm text-muted">
        <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-violet" />
        {change === null
          ? `No spending in ${formatMonth(previousMonth)} to compare with.`
          : `Spending is ${change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'}${change === 0 ? '' : ` ${Math.abs(change)}%`} compared with ${formatMonth(previousMonth)}.`}
      </p>

      {totals.categories.length > 0 && (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Donut slices={totals.categories} />
          <div className="w-full">
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Where it went</h3>
            <ul className="mt-3 space-y-4">
              {totals.categories.map((c) => (
                <li key={c.categoryId ?? 'none'}>
                  {/* The text carries the meaning; colour and bar are extra, never the only signal. */}
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold">
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
                  <div aria-hidden="true" className="mt-1.5 h-2.5 rounded-full bg-track">
                    <div
                      className="h-2.5 origin-left animate-grow rounded-full"
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
