import { createContext } from 'react'
import type { TransactionsApi } from './api'

export const TransactionsApiContext = createContext<TransactionsApi | null>(null)
