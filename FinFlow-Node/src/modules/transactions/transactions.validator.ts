import { z } from 'zod'

// Mirrors Prisma enums — no @prisma/client dependency needed before generate
export type TxType   = 'CREDIT' | 'DEBIT'
export type TxSource = 'MANUAL' | 'PDF' | 'PLAID'

const TxTypeEnum   = z.enum(['CREDIT', 'DEBIT'])
const TxSourceEnum = z.enum(['MANUAL', 'PDF', 'PLAID'])

export const createTransactionSchema = z.object({
  body: z.object({
    amount:      z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
    type:        TxTypeEnum,
    category:    z.string({ required_error: 'Category is required' }).min(1),
    description: z.string().optional(),
    date:        z.string({ required_error: 'Date is required' }).datetime(),
    source:      TxSourceEnum.optional().default('MANUAL'),
  }),
})

export const updateTransactionSchema = z.object({
  body: z.object({
    amount:      z.number().positive().optional(),
    category:    z.string().min(1).optional(),
    description: z.string().optional(),
    date:        z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const listTransactionSchema = z.object({
  query: z.object({
    page:      z.string().optional().default('1'),
    limit:     z.string().optional().default('20'),
    type:      TxTypeEnum.optional(),
    category:  z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate:   z.string().datetime().optional(),
  }),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>['body']
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>['body']
export type ListTransactionQuery   = z.infer<typeof listTransactionSchema>['query']