import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { IsoDate } from '../../lib/dates/dates'
import {
  categoryRow,
  ruleRow,
  transactionRow,
  type Category,
  type Rule,
  type Transaction,
} from './types'

/** Everything the screens need from the database. Tests swap in a fake with the same shape. */
export interface TransactionsApi {
  listCategories(): Promise<Category[]>
  listRules(): Promise<Rule[]>
  listTransactions(range: { from: IsoDate; to: IsoDate }): Promise<Transaction[]>
  /** Every entry the person has, for export. Pages through the results. */
  listAllTransactions(): Promise<Transaction[]>
  addTransaction(transaction: Transaction): Promise<void>
  deleteTransaction(id: string): Promise<void>
  restoreTransaction(id: string): Promise<void>
  saveRule(keyword: string, categoryId: string): Promise<void>
}

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

const toTransaction = (r: z.infer<typeof transactionRow>): Transaction => ({
  id: r.id,
  amountMinor: r.amount_minor,
  kind: r.kind,
  categoryId: r.category_id,
  note: r.note,
  occurredOn: r.occurred_on,
})

const PAGE_SIZE = 1000 // the most rows Supabase returns per request by default

// Note: we never send user_id. The database fills it in from the logged-in session, and Row
// Level Security rejects anything else.
export function createSupabaseTransactionsApi(client: SupabaseClient): TransactionsApi {
  return {
    async listCategories() {
      const { data, error } = await client
        .from('categories')
        .select('id, name, kind, color')
        .is('archived_at', null)
        .order('kind') // expense before income
        .order('sort_order')
        .order('name') // fixed tie-breakers: the list must come back in the same order every time, because colours depend on position
      check(error)
      return z.array(categoryRow).parse(data)
    },

    async listRules() {
      const { data, error } = await client.from('category_rules').select('id, keyword, category_id')
      check(error)
      return z
        .array(ruleRow)
        .parse(data)
        .map((r) => ({ id: r.id, keyword: r.keyword, categoryId: r.category_id }))
    },

    async listTransactions({ from, to }) {
      const { data, error } = await client
        .from('transactions')
        .select('id, amount_minor, kind, category_id, note, occurred_on')
        .is('deleted_at', null) // soft-deleted rows stay hidden
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
      check(error)
      return z
        .array(transactionRow)
        .parse(data)
        .map((r) => ({
          id: r.id,
          amountMinor: r.amount_minor,
          kind: r.kind,
          categoryId: r.category_id,
          note: r.note,
          occurredOn: r.occurred_on,
        }))
    },

    async listAllTransactions() {
      const all: Transaction[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await client
          .from('transactions')
          .select('id, amount_minor, kind, category_id, note, occurred_on')
          .is('deleted_at', null)
          .order('occurred_on', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id') // a fixed tie-breaker, so pages never overlap or skip rows
          .range(from, from + PAGE_SIZE - 1)
        check(error)
        const page = z.array(transactionRow).parse(data).map(toTransaction)
        all.push(...page)
        if (page.length < PAGE_SIZE) return all
      }
    },

    async addTransaction(t) {
      const { error } = await client.from('transactions').insert({
        id: t.id,
        amount_minor: t.amountMinor,
        kind: t.kind,
        category_id: t.categoryId,
        note: t.note,
        occurred_on: t.occurredOn,
      })
      check(error)
    },

    async deleteTransaction(id) {
      const { error } = await client
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      check(error)
    },

    async restoreTransaction(id) {
      const { error } = await client.from('transactions').update({ deleted_at: null }).eq('id', id)
      check(error)
    },

    async saveRule(keyword, categoryId) {
      const { error } = await client
        .from('category_rules')
        .upsert({ keyword, category_id: categoryId }, { onConflict: 'user_id,keyword' })
      check(error)
    },
  }
}
