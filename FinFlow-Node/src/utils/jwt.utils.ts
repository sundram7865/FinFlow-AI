import jwt from 'jsonwebtoken'
import { JwtPayload, Role } from '../types'

const ACCESS_SECRET  = process.env.ACCESS_TOKEN_SECRET  as string
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string
const ACCESS_EXPIRY  = process.env.ACCESS_TOKEN_EXPIRY  as string || '15m'
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as string || '7d'

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions)
}

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions)
}

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}

export const signTokenPair = (userId: string, email: string, role: Role) => {
  const payload: JwtPayload = { userId, email, role }
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}