import { z } from 'zod'

export const createGoalSchema = z.object({
  body: z.object({
    title:        z.string({ required_error: 'Title is required' }).min(2),
    description:  z.string().optional(),
    targetAmount: z.number({ required_error: 'Target amount is required' }).positive(),
    deadline:     z.string({ required_error: 'Deadline is required' }).datetime(),
  }),
})

export const updateGoalSchema = z.object({
  body: z.object({
    title:        z.string().min(2).optional(),
    description:  z.string().optional(),
    targetAmount: z.number().positive().optional(),
    savedAmount:  z.number().min(0).optional(),
    deadline:     z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>['body']
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>['body']