import { vi } from 'vitest'
import type { Category, Rule, Transaction } from '../features/transactions/types'

export const categoriesFixture: Category[] = [
  { id: 'cat-transport', name: 'Transport', kind: 'expense', color: '#3b6ea8' },
  { id: 'cat-eating', name: 'Eating out', kind: 'expense', color: '#d9822b' },
  { id: 'cat-food', name: 'Food and groceries', kind: 'expense', color: '#2e7d5b' },
  { id: 'cat-salary', name: 'Salary', kind: 'income', color: '#1f6f4a' },
]

/** An in-memory stand-in for the database: same methods, no network, every call recorded. */
export function createFakeTransactionsApi(seed: Transaction[] = []) {
  const store = new Map(seed.map((t) => [t.id, t]))
  const hidden = new Set<string>()
  const rules: Rule[] = [
    { id: 'r1', keyword: 'bolt', categoryId: 'cat-transport' },
    { id: 'r2', keyword: 'lunch', categoryId: 'cat-eating' },
    { id: 'r3', keyword: 'salary', categoryId: 'cat-salary' },
  ]
  return {
    listCategories: vi.fn(async () => categoriesFixture),
    listRules: vi.fn(async () => [...rules]),
    listTransactions: vi.fn(async ({ from, to }: { from: string; to: string }) =>
      [...store.values()]
        .filter((t) => !hidden.has(t.id) && t.occurredOn >= from && t.occurredOn <= to)
        .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn)),
    ),
    addTransaction: vi.fn(async (t: Transaction) => void store.set(t.id, t)),
    deleteTransaction: vi.fn(async (id: string) => void hidden.add(id)),
    restoreTransaction: vi.fn(async (id: string) => void hidden.delete(id)),
    saveRule: vi.fn(
      async (keyword: string, categoryId: string) =>
        void rules.push({ id: `r${rules.length + 1}`, keyword, categoryId }),
    ),
  }
}
export type FakeTransactionsApi = ReturnType<typeof createFakeTransactionsApi>
