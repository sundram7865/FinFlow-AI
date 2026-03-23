import { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.utils.js'
import { sendError } from '../utils/apiResponse.js'
import { AuthRequest } from '../types'

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401)
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED')
      return
    }
    sendError(res, 'Invalid token', 401, 'INVALID_TOKEN')
  }
}