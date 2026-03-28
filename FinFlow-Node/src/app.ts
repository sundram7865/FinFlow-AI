import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes        from './modules/auth/auth.routes'
import transactionRoutes from './modules/transactions/transactions.routes'
import goalRoutes        from './modules/goals/goals.routes'
import uploadRoutes      from './modules/upload/upload.routes'
import reportRoutes      from './modules/reports/reports.routes'
import aiRoutes          from './modules/ai/ai.routes'
import { errorHandler }  from './middleware/error.middleware'

const app = express()

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:3001',
  credentials: true,
}))

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { success: false, message: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many auth attempts, please try again later.' },
})

app.use(globalLimiter)

// ─── BODY PARSING ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── LOGGING ──────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use('/api/auth',         authLimiter, authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/goals',        goalRoutes)
app.use('/api/upload',       uploadRoutes)
app.use('/api/reports',      reportRoutes)
app.use('/api/ai',           aiRoutes)

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────

app.use(errorHandler)

export default app