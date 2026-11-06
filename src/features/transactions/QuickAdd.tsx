import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { formatDayHeading, todayIso, type IsoDate } from '../../lib/dates/dates'
import { formatNaira } from '../../lib/money/money'
import { parse } from '../../lib/parser/parser'
import { Button } from '../../components/ui/Button'
import { useAddTransaction, useCategories, useRules, useSaveRule } from './hooks'
import type { Category, Rule, Transaction } from './types'

// Stable empty lists: a fresh `[]` every render would make useMemo recalculate every time.
const NO_CATEGORIES: Category[] = []
const NO_RULES: Rule[] = []

export function QuickAdd() {
  const categories = useCategories().data ?? NO_CATEGORIES
  const rules = useRules().data ?? NO_RULES
  const add = useAddTransaction()
  const saveRule = useSaveRule()

  const [text, setText] = useState('')
  // undefined = "no manual correction"; the parser's answer is used.
  const [categoryOverride, setCategoryOverride] = useState<string | null | undefined>(undefined)
  const [dateOverride, setDateOverride] = useState<IsoDate | undefined>(undefined)
  const [savedMessage, setSavedMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const today = todayIso()
  const parsed = useMemo(
    () => parse(text, { today, categories, rules }),
    [text, today, categories, rules],
  )

  // A correction only counts if its category still matches the entry's kind (expense/income).
  const overrideOk =
    categoryOverride === undefined ||
    categoryOverride === null ||
    categories.find((c) => c.id === categoryOverride)?.kind === parsed.kind
  const categoryId =
    categoryOverride !== undefined && overrideOk ? categoryOverride : parsed.categoryId
  const date = dateOverride ?? parsed.occurredOn
  const choices = categories.filter((c) => c.kind === parsed.kind)
  const canSave = parsed.amountMinor !== null

  // Keyboard shortcut: press "/" or "n" anywhere (outside a field) to jump to quick add.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable]')
      )
        return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '/' || event.key.toLowerCase() === 'n') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (parsed.amountMinor === null) return
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      amountMinor: parsed.amountMinor,
      kind: parsed.kind,
      categoryId,
      note: parsed.note,
      occurredOn: date,
    }
    add.mutate(transaction)
    // Learning: if the person fixed the category, remember the keyword for next time.
    if (
      categoryOverride &&
      overrideOk &&
      parsed.keyword &&
      categoryOverride !== parsed.categoryId
    ) {
      saveRule.mutate({ keyword: parsed.keyword, categoryId: categoryOverride })
    }
    const categoryName = categories.find((c) => c.id === categoryId)?.name
    setSavedMessage(
      `Saved ${formatNaira(transaction.amountMinor)}${categoryName ? ` in ${categoryName}` : ''}.`,
    )
    setText('')
    setCategoryOverride(undefined)
    setDateOverride(undefined)
  }

  return (
    <section aria-label="Quick add" className="border-t-4 border-deep bg-card p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            aria-label="Quick add"
            placeholder='Try "bolt 2.5k yesterday" or "+salary 500k"'
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 rounded-sm border-2 border-ink/40 bg-surface px-3 py-3 font-display text-xl"
          />
          <Button type="submit" disabled={!canSave}>
            Add
          </Button>
        </div>

        {text.trim() !== '' && (
          <ul aria-label="Preview" className="flex flex-wrap items-center gap-2 text-sm">
            <li className="animate-pop rounded-full bg-ink/5 px-3 py-1">
              Amount:{' '}
              <strong>
                {parsed.amountMinor === null ? 'none yet' : formatNaira(parsed.amountMinor)}
              </strong>
            </li>
            <li className="animate-pop rounded-full bg-ink/5 px-3 py-1">
              {parsed.kind === 'income' ? 'Income' : 'Expense'}
            </li>
            <li className="animate-pop rounded-full bg-ink/5 px-3 py-1">
              <label>
                Category{' '}
                <select
                  value={categoryId ?? ''}
                  onChange={(e) =>
                    setCategoryOverride(e.target.value === '' ? null : e.target.value)
                  }
                  className="bg-transparent"
                >
                  <option value="">Uncategorised</option>
                  {choices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </li>
            <li className="animate-pop rounded-full bg-ink/5 px-3 py-1">
              <label>
                Date{' '}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDateOverride(e.target.value)}
                  className="bg-transparent"
                />
              </label>{' '}
              <span className="text-muted">({formatDayHeading(date, today)})</span>
            </li>
          </ul>
        )}

        <div aria-live="polite" className="min-h-5 text-sm">
          {text.trim() !== '' &&
            parsed.warnings.map((w) => (
              <p key={w.code} className="text-danger">
                {w.message}
              </p>
            ))}
          {text.trim() === '' && savedMessage && (
            <p role="status" className="text-brand">
              {savedMessage}
            </p>
          )}
        </div>
        {add.isError && (
          <p role="alert" className="text-sm text-danger">
            Your last entry could not be saved. Please add it again.
          </p>
        )}
      </form>
    </section>
  )
}
