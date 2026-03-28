import { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.utils'
import { sendError } from '../utils/apiResponse'
import { AuthRequest } from '../types'
import redis from '../config/redis'
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401)
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    if (redis) {
      const blacklisted = await redis.get(`blacklist:${token}`)
      if (blacklisted) {
        sendError(res, 'Token has been revoked', 401, 'TOKEN_REVOKED')
        return
      }
    }
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED')
      return
    }
    sendError(res, 'Invalid token', 401, 'INVALID_TOKEN')
  }
}