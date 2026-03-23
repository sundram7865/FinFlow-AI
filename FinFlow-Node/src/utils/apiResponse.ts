import { Response } from 'express'
import { ApiResponse } from '../types'

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = { success: true, message, data }
  return res.status(statusCode).json(response)
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  const response: ApiResponse = { success: false, message, error }
  return res.status(statusCode).json(response)
}

export const sendCreated = <T>(res: Response, message: string, data?: T): Response => {
  return sendSuccess(res, message, data, 201)
}