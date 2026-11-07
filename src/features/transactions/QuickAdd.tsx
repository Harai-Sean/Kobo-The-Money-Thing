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

  const chip = 'animate-pop rounded-full px-4 py-1.5'
  return (
    <section aria-label="Quick add">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            aria-label="Quick add"
            placeholder="coffee 1500 yesterday"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-14 min-w-0 flex-1 rounded-full border-2 border-ink bg-card px-5 font-display text-lg font-bold"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Add"
            disabled={!canSave}
            className="size-14 text-3xl leading-none"
          >
            +
          </Button>
        </div>

        {text.trim() !== '' && (
          <ul
            aria-label="Preview"
            className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold"
          >
            <li className={`${chip} bg-sun`}>
              <span className="sr-only">Amount: </span>
              <strong>
                {parsed.amountMinor === null ? 'no amount yet' : formatNaira(parsed.amountMinor)}
              </strong>
            </li>
            <li className={`${chip} ${parsed.kind === 'income' ? 'bg-tint-leaf' : 'bg-track'}`}>
              {parsed.kind === 'income' ? 'Income' : 'Expense'}
            </li>
            <li className={`${chip} bg-tint-blue`}>
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
            <li className={`${chip} bg-tint-violet`}>
              <label>
                Date{' '}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDateOverride(e.target.value)}
                  className="bg-transparent"
                />
              </label>{' '}
              <span className="font-normal text-muted">({formatDayHeading(date, today)})</span>
            </li>
          </ul>
        )}

        <div aria-live="polite" className="text-sm">
          {text.trim() !== '' &&
            parsed.warnings.map((w) => (
              <p key={w.code} className="mt-2 text-danger">
                {w.message}
              </p>
            ))}
          {text.trim() === '' && savedMessage && (
            <p role="status" className="mt-2 font-semibold text-leaf-ink">
              {savedMessage}
            </p>
          )}
        </div>
        {add.isError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            Your last entry could not be saved. Please add it again.
          </p>
        )}
      </form>
    </section>
  )
}
