import { useState } from 'react'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { Button } from '../../components/ui/Button'
import { formatMonth, monthOf, todayIso } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import {
  filterRows,
  rowsToTsv,
  sortRows,
  statsOf,
  toRows,
  type KindFilter,
  type SortDir,
  type SortKey,
} from '../../lib/sheet'
import { useCategories, useMonthTransactions } from '../transactions/hooks'

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'note', label: 'Note' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

export function SheetPage() {
  const [month, setMonth] = useState(() => monthOf(todayIso()))
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' })
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [anchor, setAnchor] = useState<number | null>(null) // last ticked row, for shift-click ranges
  const [copyMessage, setCopyMessage] = useState('')

  const query$ = useMonthTransactions(month)
  const categories = useCategories().data ?? []

  const all = toRows(query$.data ?? [], categories)
  const visible = sortRows(filterRows(all, { query, kind }), sort.key, sort.dir)
  const picked = visible.filter((r) => selected.has(r.id))
  const everyRowPicked = visible.length > 0 && picked.length === visible.length
  const totals = statsOf(visible)
  const stats = statsOf(picked)

  function changeMonth(next: string) {
    setMonth(next)
    setSelected(new Set()) // a selection only makes sense within the month it was made in
    setAnchor(null)
  }

  function toggleRow(index: number, shift: boolean) {
    const row = visible[index]
    if (!row) return
    const next = new Set(selected)
    if (shift && anchor !== null) {
      const turnOn = !selected.has(row.id)
      for (let i = Math.min(anchor, index); i <= Math.max(anchor, index); i++) {
        const inRange = visible[i]
        if (!inRange) continue
        if (turnOn) next.add(inRange.id)
        else next.delete(inRange.id)
      }
    } else if (next.has(row.id)) next.delete(row.id)
    else next.add(row.id)
    setSelected(next)
    setAnchor(index)
  }

  function toggleAll() {
    setSelected(everyRowPicked ? new Set() : new Set(visible.map((r) => r.id)))
    setAnchor(null)
  }

  function sortBy(key: SortKey) {
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  async function copy() {
    const rows = picked.length > 0 ? picked : visible
    try {
      await navigator.clipboard.writeText(rowsToTsv(rows))
      setCopyMessage(`Copied ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}.`)
    } catch {
      setCopyMessage('Could not copy. Your browser blocked it.')
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-5 pb-16 pt-1">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Sheet</h1>
      <MonthSwitcher month={month} onChange={changeMonth} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="sheet-search" className="block text-sm font-semibold">
            Search entries
          </label>
          <input
            id="sheet-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="note, category or date"
            className="mt-1 h-12 w-full rounded-full border-2 border-ink bg-card px-5"
          />
        </div>
        <div>
          <label htmlFor="sheet-kind" className="block text-sm font-semibold">
            Type
          </label>
          <select
            id="sheet-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as KindFilter)}
            className="mt-1 h-12 rounded-full border-2 border-ink bg-card px-4"
          >
            <option value="all">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
        <Button variant="secondary" onClick={() => void copy()} disabled={visible.length === 0}>
          {picked.length > 0 ? 'Copy selected' : 'Copy table'}
        </Button>
      </div>

      <p
        role="status"
        className="rounded-full bg-tint-blue px-5 py-3 text-sm font-semibold tabular-nums"
      >
        {picked.length > 0
          ? `${stats.count} selected · In ${formatNaira(stats.income)} · Out ${formatNaira(stats.expense)} · Net ${formatNaira(stats.net)} · Average ${formatNaira(stats.average)}`
          : copyMessage || 'Tick rows to add them up. Shift-click to tick a range.'}
      </p>

      {query$.isPending && (
        <p role="status" className="text-muted">
          Loading entries…
        </p>
      )}
      {query$.isError && (
        <div role="alert" className="space-y-2">
          <p className="text-danger">Could not load this month.</p>
          <Button variant="secondary" onClick={() => void query$.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query$.isSuccess && all.length === 0 && (
        <p className="text-muted">No entries in {formatMonth(month)}.</p>
      )}
      {query$.isSuccess && all.length > 0 && visible.length === 0 && (
        <p className="text-muted">No entries match your search.</p>
      )}

      {visible.length > 0 && (
        <div
          role="region"
          aria-label="Entries table"
          tabIndex={0}
          className="max-h-[70vh] overflow-auto rounded-2xl border-2 border-ink"
        >
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">Entries for {formatMonth(month)}</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={everyRowPicked}
                    onChange={toggleAll}
                    className="size-4 accent-brand"
                  />
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      sort.key === c.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => sortBy(c.key)}
                      className="font-bold underline-offset-4 hover:underline"
                    >
                      {c.label}
                      <span aria-hidden="true">
                        {sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, index) => (
                <tr
                  key={r.id}
                  className={`border-b border-line odd:bg-ink/5 ${selected.has(r.id) ? 'bg-tint-blue odd:bg-tint-blue' : ''}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.title}, ${r.date}`}
                      checked={selected.has(r.id)}
                      onChange={() => {}} // the click handler below does the work, so it can see the Shift key
                      onClick={(e) => toggleRow(index, e.shiftKey)}
                      className="size-4 accent-brand"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.date}</td>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${r.kind === 'income' ? 'text-leaf-ink' : ''}`}
                  >
                    {r.kind === 'income' ? '+' : ''}
                    {formatNaira(r.amountMinor)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-card">
              <tr className="border-t-2 border-ink font-bold">
                <th scope="row" colSpan={4} className="px-3 py-2 text-left">
                  Shown: {totals.count} {totals.count === 1 ? 'row' : 'rows'} · In{' '}
                  {formatNaira(totals.income)} · Out {formatNaira(totals.expense)}
                </th>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  Net {formatNaira(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  )
}
