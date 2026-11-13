import { addMonths, formatMonth, monthOf, todayIso, type MonthKey } from '../lib/dates/dates'
import { Button } from './ui/Button'

/** Previous / next month buttons around the month name. You cannot go into the future. */
export function MonthSwitcher({
  month,
  onChange,
}: {
  month: MonthKey
  onChange: (month: MonthKey) => void
}) {
  const currentMonth = monthOf(todayIso())
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="secondary"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(addMonths(month, -1))}
      >
        ←
      </Button>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{formatMonth(month)}</h2>
      <Button
        variant="secondary"
        size="icon"
        aria-label="Next month"
        disabled={month >= currentMonth}
        onClick={() => onChange(addMonths(month, 1))}
      >
        →
      </Button>
    </div>
  )
}
