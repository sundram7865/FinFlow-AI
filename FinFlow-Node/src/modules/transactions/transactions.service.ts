import prisma from '../../config/db.postgres'
import { AppError } from '../../middleware/error.middleware'
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionQuery,
  TxType,
} from './transactions.validator'
import { PaginatedResult } from '../../types'

// ─── Transaction type (avoid Prisma namespace dependency) ────────────────────

interface TransactionWhereInput {
  userId:    string
  type?:     TxType
  category?: string
  date?: {
    gte?: Date
    lte?: Date
  }
}

interface TransactionRecord {
  id:          string
  userId:      string
  amount:      number
  type:        string
  category:    string
  description: string | null
  date:        Date
  source:      string
  createdAt:   Date
  updatedAt:   Date
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createTransaction = async (userId: string, input: CreateTransactionInput) => {
  return prisma.transaction.create({
    data: {
      userId,
      amount:      input.amount,
      type:        input.type,
      category:    input.category,
      description: input.description,
      date:        new Date(input.date),
      source:      input.source,
    },
  })
}

// ─── LIST WITH FILTERS + PAGINATION ───────────────────────────────────────────

export const listTransactions = async (
  userId: string,
  query: ListTransactionQuery
): Promise<PaginatedResult<TransactionRecord>> => {
  const page  = parseInt(query.page  ?? '1')
  const limit = parseInt(query.limit ?? '20')
  const skip  = (page - 1) * limit

  const where: TransactionWhereInput = { userId }

  if (query.type)     where.type     = query.type as TxType
  if (query.category) where.category = query.category

  if (query.startDate || query.endDate) {
    where.date = {}
    if (query.startDate) where.date.gte = new Date(query.startDate)
    if (query.endDate)   where.date.lte = new Date(query.endDate)
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.transaction.count({ where }),
  ])

  return {
    data:       data as TransactionRecord[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ─── GET ONE ──────────────────────────────────────────────────────────────────

export const getTransaction = async (userId: string, id: string) => {
  const tx = await prisma.transaction.findUnique({ where: { id } })
  if (!tx)                  throw new AppError('Transaction not found', 404)
  if (tx.userId !== userId) throw new AppError('Forbidden', 403)
  return tx
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateTransaction = async (
  userId: string,
  id: string,
  input: UpdateTransactionInput
) => {
  await getTransaction(userId, id)

  return prisma.transaction.update({
    where: { id },
    data: {
      ...(input.amount      !== undefined && { amount:      input.amount }),
      ...(input.category    !== undefined && { category:    input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.date        !== undefined && { date:        new Date(input.date) }),
    },
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteTransaction = async (userId: string, id: string): Promise<void> => {
  await getTransaction(userId, id)
  await prisma.transaction.delete({ where: { id } })
}

// ─── SUMMARY (for dashboard) ──────────────────────────────────────────────────

export const getTransactionSummary = async (userId: string, month: number, year: number) => {
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 1)

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
  })

  const totalIncome = transactions
    .filter((t: TransactionRecord) => t.type === 'CREDIT')
    .reduce((s: number, t: TransactionRecord) => s + t.amount, 0)

  const totalExpense = transactions
    .filter((t: TransactionRecord) => t.type === 'DEBIT')
    .reduce((s: number, t: TransactionRecord) => s + t.amount, 0)

  const byCategory = transactions.reduce((acc: Record<string, number>, t: TransactionRecord) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory,
  }
}

// ─── BULK INSERT (called after PDF parse) ─────────────────────────────────────

export const bulkInsertTransactions = async (
  userId: string,
  transactions: CreateTransactionInput[]
) => {
  return prisma.transaction.createMany({
    data: transactions.map((t: CreateTransactionInput) => ({
      userId,
      amount:      t.amount,
      type:        t.type,
      category:    t.category,
      description: t.description,
      date:        new Date(t.date),
      source:      'PDF' as const,
    })),
    skipDuplicates: true,
  })
}