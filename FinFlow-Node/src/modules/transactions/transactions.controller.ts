import { Response, NextFunction } from 'express'
import * as txService from './transactions.service'
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionSchema,
} from './transactions.validator'
import { sendSuccess, sendCreated } from '../../utils/apiResponse'
import { AuthRequest } from '../../types'

// POST /api/transactions
export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = createTransactionSchema.parse({ body: req.body })
    const tx       = await txService.createTransaction(req.user!.userId, body)
    sendCreated(res, 'Transaction created', tx)
  } catch (err) { next(err) }
}

// GET /api/transactions
export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = listTransactionSchema.parse({ query: req.query })
    const result    = await txService.listTransactions(req.user!.userId, query)
    sendSuccess(res, 'Transactions fetched', result)
  } catch (err) { next(err) }
}

// GET /api/transactions/summary
export const summary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1
    const year  = parseInt(req.query.year  as string) || new Date().getFullYear()
    const data  = await txService.getTransactionSummary(req.user!.userId, month, year)
    sendSuccess(res, 'Summary fetched', data)
  } catch (err) { next(err) }
}

// GET /api/transactions/:id
export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tx = await txService.getTransaction(req.user!.userId, req.params.id)
    sendSuccess(res, 'Transaction fetched', tx)
  } catch (err) { next(err) }
}

// PATCH /api/transactions/:id
export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = updateTransactionSchema.parse({ body: req.body, params: req.params })
    const tx       = await txService.updateTransaction(req.user!.userId, req.params.id, body)
    sendSuccess(res, 'Transaction updated', tx)
  } catch (err) { next(err) }
}

// DELETE /api/transactions/:id
export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await txService.deleteTransaction(req.user!.userId, req.params.id)
    sendSuccess(res, 'Transaction deleted')
  } catch (err) { next(err) }
}