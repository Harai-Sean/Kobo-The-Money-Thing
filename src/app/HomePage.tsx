import { useState } from 'react'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { monthOf, todayIso } from '../lib/dates/dates'
import { MonthSummary } from '../features/transactions/MonthSummary'
import { QuickAdd } from '../features/transactions/QuickAdd'
import { TransactionList } from '../features/transactions/TransactionList'

export function HomePage() {
  const [month, setMonth] = useState(() => monthOf(todayIso()))

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-5 pb-16 pt-1">
      <h1 className="sr-only">Kobo</h1>
      <QuickAdd />
      <MonthSwitcher month={month} onChange={setMonth} />
      <MonthSummary month={month} />
      <TransactionList month={month} />
    </main>
  )
}
