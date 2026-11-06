import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { monthOf, monthRange, type MonthKey } from '../../lib/dates/dates'
import type { TransactionsApi } from './api'
import { TransactionsApiContext } from './api-context'
import type { Transaction } from './types'

export function useTransactionsApi(): TransactionsApi {
  const api = useContext(TransactionsApiContext)
  if (!api) throw new Error('Missing TransactionsApiContext provider')
  return api
}

// One cache entry per month, so switching months is instant after the first load.
export const keys = {
  categories: ['categories'] as const,
  rules: ['rules'] as const,
  month: (month: MonthKey) => ['transactions', month] as const,
}

export function useCategories() {
  const api = useTransactionsApi()
  return useQuery({
    queryKey: keys.categories,
    queryFn: () => api.listCategories(),
    staleTime: 5 * 60_000,
  })
}

export function useRules() {
  const api = useTransactionsApi()
  return useQuery({ queryKey: keys.rules, queryFn: () => api.listRules(), staleTime: 5 * 60_000 })
}

export function useMonthTransactions(month: MonthKey) {
  const api = useTransactionsApi()
  return useQuery({
    queryKey: keys.month(month),
    queryFn: () => api.listTransactions(monthRange(month)),
  })
}

// Newest day first. Array.sort is stable, so entries within a day keep their order.
const byDateDesc = (list: Transaction[]) =>
  [...list].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))

/**
 * Optimistic update: change the cached list immediately so the UI never waits for the network,
 * and remember the old list so we can roll back if the server refuses.
 */
async function applyOptimistic(
  qc: QueryClient,
  tx: Transaction,
  change: (list: Transaction[]) => Transaction[],
) {
  const key = keys.month(monthOf(tx.occurredOn))
  await qc.cancelQueries({ queryKey: key }) // stop an in-flight fetch overwriting our change
  const previous = qc.getQueryData<Transaction[]>(key)
  if (previous) qc.setQueryData(key, change(previous))
  return { key, previous }
}

type Snapshot = Awaited<ReturnType<typeof applyOptimistic>>

function useOptimisticMutation(
  run: (api: TransactionsApi, tx: Transaction) => Promise<void>,
  change: (list: Transaction[], tx: Transaction) => Transaction[],
) {
  const api = useTransactionsApi()
  const qc = useQueryClient()
  return useMutation<void, Error, Transaction, Snapshot>({
    mutationFn: (tx) => run(api, tx),
    onMutate: (tx) => applyOptimistic(qc, tx, (list) => change(list, tx)),
    onError: (_error, _tx, snapshot) => {
      if (snapshot?.previous) qc.setQueryData(snapshot.key, snapshot.previous) // roll back
    },
    onSettled: (_data, _error, tx) =>
      qc.invalidateQueries({ queryKey: keys.month(monthOf(tx.occurredOn)) }),
  })
}

export const useAddTransaction = () =>
  useOptimisticMutation(
    (api, tx) => api.addTransaction(tx),
    (list, tx) => byDateDesc([tx, ...list]),
  )

export const useDeleteTransaction = () =>
  useOptimisticMutation(
    (api, tx) => api.deleteTransaction(tx.id),
    (list, tx) => list.filter((t) => t.id !== tx.id),
  )

export const useRestoreTransaction = () =>
  useOptimisticMutation(
    (api, tx) => api.restoreTransaction(tx.id),
    (list, tx) => byDateDesc([tx, ...list]),
  )

export function useSaveRule() {
  const api = useTransactionsApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rule: { keyword: string; categoryId: string }) =>
      api.saveRule(rule.keyword, rule.categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.rules }),
  })
}
