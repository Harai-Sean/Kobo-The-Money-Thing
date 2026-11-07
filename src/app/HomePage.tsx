import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { addMonths, formatMonth, monthOf, todayIso } from '../lib/dates/dates'
import { MonthSummary } from '../features/transactions/MonthSummary'
import { QuickAdd } from '../features/transactions/QuickAdd'
import { TransactionList } from '../features/transactions/TransactionList'

export function HomePage() {
  const currentMonth = monthOf(todayIso())
  const [month, setMonth] = useState(currentMonth)

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-5 pb-16 pt-1">
      <h1 className="sr-only">Kobo</h1>
      <QuickAdd />
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          ←
        </Button>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          {formatMonth(month)}
        </h2>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Next month"
          disabled={month >= currentMonth}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          →
        </Button>
      </div>
      <MonthSummary month={month} />
      <TransactionList month={month} />
    </main>
  )
}
