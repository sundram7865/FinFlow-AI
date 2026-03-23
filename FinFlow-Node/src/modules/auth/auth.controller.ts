import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { registerSchema, loginSchema, refreshSchema } from './auth.validator'
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse'
import { AuthRequest } from '../../types'

// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = registerSchema.parse({ body: req.body })
    const result   = await authService.registerUser(body)
    sendCreated(res, 'Account created successfully', result)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = loginSchema.parse({ body: req.body })
    const result   = await authService.loginUser(body)
    sendSuccess(res, 'Login successful', result)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = refreshSchema.parse({ body: req.body })
    const tokens   = await authService.refreshAccessToken(body.refreshToken)
    sendSuccess(res, 'Token refreshed', tokens)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken as string
    const accessToken  = req.headers.authorization?.split(' ')[1] ?? ''

    if (!refreshToken) {
      sendError(res, 'Refresh token required', 400)
      return
    }

    await authService.logoutUser(refreshToken, accessToken)
    sendSuccess(res, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getUserProfile(req.user!.userId)
    sendSuccess(res, 'Profile fetched', user)
  } catch (err) {
    next(err)
  }
}