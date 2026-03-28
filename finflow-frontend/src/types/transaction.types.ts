export type TxType   = 'CREDIT' | 'DEBIT'
export type TxSource = 'MANUAL' | 'PDF' | 'PLAID'

export interface Transaction {
  id:          string
  userId:      string
  amount:      number
  type:        TxType
  category:    string
  description: string | null
  date:        string
  source:      TxSource
  createdAt:   string
}

export interface TransactionSummary {
  totalIncome:  number
  totalExpense: number
  balance:      number
  byCategory:   Record<string, number>
}

export interface CreateTransactionInput {
  amount:      number
  type:        TxType
  category:    string
  description?: string
  date:        string
}

export interface TransactionFilters {
  type?:      TxType
  category?:  string
  startDate?: string
  endDate?:   string
  page?:      number
  limit?:     number
}

export const CATEGORIES = [
  'salary', 'food', 'transport', 'rent', 'shopping',
  'entertainment', 'healthcare', 'utilities', 'transfer', 'other'
] as const