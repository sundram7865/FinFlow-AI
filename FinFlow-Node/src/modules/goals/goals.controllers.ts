import { Response, NextFunction } from 'express'
import * as goalsService from './goals.service'
import { createGoalSchema, updateGoalSchema } from './goals.validator'
import { sendSuccess, sendCreated } from '../../utils/apiResponse'
import { AuthRequest } from '../../types'

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = createGoalSchema.parse({ body: req.body })
    const goal     = await goalsService.createGoal(req.user!.userId, body)
    sendCreated(res, 'Goal created', goal)
  } catch (err) { next(err) }
}

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goals = await goalsService.listGoals(req.user!.userId)
    sendSuccess(res, 'Goals fetched', goals)
  } catch (err) { next(err) }
}

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goal = await goalsService.getGoal(req.user!.userId, req.params.id)
    sendSuccess(res, 'Goal fetched', goal)
  } catch (err) { next(err) }
}

export const getProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const progress = await goalsService.getGoalProgress(req.user!.userId, req.params.id)
    sendSuccess(res, 'Progress fetched', progress)
  } catch (err) { next(err) }
}

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = updateGoalSchema.parse({ body: req.body, params: req.params })
    const goal     = await goalsService.updateGoal(req.user!.userId, req.params.id, body)
    sendSuccess(res, 'Goal updated', goal)
  } catch (err) { next(err) }
}

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await goalsService.deleteGoal(req.user!.userId, req.params.id)
    sendSuccess(res, 'Goal deleted')
  } catch (err) { next(err) }
}