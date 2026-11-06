import { z } from 'zod'
import { isIsoDate, type IsoDate } from '../../lib/dates/dates'
import type { TxnKind } from '../../lib/parser/parser'

export type { TxnKind }

export interface Category {
  id: string
  name: string
  kind: TxnKind
  color: string
}
export interface Rule {
  id: string
  keyword: string
  categoryId: string
}
export interface Transaction {
  id: string // generated in the browser, so an optimistic row is the REAL row
  amountMinor: number // integer kobo
  kind: TxnKind
  categoryId: string | null
  note: string
  occurredOn: IsoDate
}

// What the database sends back. Zod checks it at the boundary, so a surprise shape becomes a
// clear error here instead of a mysterious bug later.
const kind = z.enum(['expense', 'income'])
export const categoryRow = z.object({ id: z.string(), name: z.string(), kind, color: z.string() })
export const ruleRow = z.object({ id: z.string(), keyword: z.string(), category_id: z.string() })
export const transactionRow = z.object({
  id: z.string(),
  amount_minor: z.number().int().positive(),
  kind,
  category_id: z.string().nullable(),
  note: z.string(),
  occurred_on: z.string().refine(isIsoDate),
})
