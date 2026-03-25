import bcrypt from 'bcryptjs'
import prisma from '../../config/db.postgres'
import redis from '../../config/redis'
import { signTokenPair, verifyRefreshToken } from '../../utils/jwt.utils'
import { AppError } from '../../middleware/error.middleware'
import { RegisterInput, LoginInput } from './auth.validator'

const SALT_ROUNDS = 12

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: {
      id:        true,
      email:     true,
      name:      true,
      role:      true,
      createdAt: true,
    },
  })

  return { user }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

  const tokens = signTokenPair(user.id, user.email, user.role)
  await storeRefreshToken(user.id, tokens.refreshToken)

  return {
    user: {
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    },
    ...tokens,
  }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

export const refreshAccessToken = async (refreshToken: string) => {
  // Verify signature first
  let payload: ReturnType<typeof verifyRefreshToken>
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
  }

  // Check token exists in DB and is not revoked
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  })

  if (!stored || stored.revoked) {
    throw new AppError('Refresh token revoked or not found', 401, 'TOKEN_REVOKED')
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED')
  }

  // Issue new token pair (rotate refresh token)
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) throw new AppError('User not found', 404)

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data:  { revoked: true },
  })

  const tokens = signTokenPair(user.id, user.email, user.role)
  await storeRefreshToken(user.id, tokens.refreshToken)

  return tokens
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export const logoutUser = async (refreshToken: string, accessToken: string): Promise<void> => {
  // Revoke refresh token in DB
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data:  { revoked: true },
  })

  // Blacklist access token in Redis until it expires (~15m)
  if (redis) {
    await redis.set(`blacklist:${accessToken}`, '1', 'EX', 900)
  }
}

// ─── GET PROFILE ──────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:        true,
      email:     true,
      name:      true,
      role:      true,
      createdAt: true,
      _count: {
        select: {
          transactions: true,
          goals:        true,
          reports:      true,
        },
      },
    },
  })

  if (!user) throw new AppError('User not found', 404)
  return user
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  })
}