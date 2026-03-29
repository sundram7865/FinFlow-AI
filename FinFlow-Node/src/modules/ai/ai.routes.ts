import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { streamAgentResponse } from '../../utils/python.bridge'
import { ChatSession } from './models/ChatSession.model'
import { Anomaly } from './models/Anomaly.model'
import { sendSuccess, sendError } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'
import redis from '../../config/redis'

const chatSchema = z.object({
  body: z.object({
    message: z.string({ required_error: 'Message is required' }).min(1).max(2000),
  }),
})

const router = Router()
router.use(authenticate)

// ─── POST /api/ai/chat  (SSE streaming) ──────────────────────────────────────

router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { body } = chatSchema.parse({ body: req.body })
    const userId   = req.user!.userId
    console.log("Received message from user", userId, ":", body.message)
    // Check Redis cache
    const cacheKey = `chat:${userId}:${body.message}`
    
    if (redis) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.write(`data: ${cached}\n\n`)
        res.end()
        return
      }
    }
    console.log("No cache hit for user", userId, "message:", body.message)
    // Collect full response while streaming so we can cache it
    let fullResponse = ''

    const originalWrite = res.write.bind(res)
    res.write = (chunk: any) => {
      fullResponse += chunk.toString()
      return originalWrite(chunk)
    }
    console.log("Calling Python agent for user", userId)
    await streamAgentResponse(userId, body.message, res)
    console.log("Finished streaming for user", userId)
    // Fix 3 — save response to cache after streaming finishes
    if (redis && fullResponse) {
      await redis.set(cacheKey, fullResponse, 'EX', 300) // 5 min
    }

  } catch (err) { next(err) }
})

// ─── GET /api/ai/history ──────────────────────────────────────────────────────

router.get('/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId  = req.user!.userId
    const limit   = parseInt(req.query.limit as string) || 50

    const session = await ChatSession.findOne({ userId })
      .select({ messages: { $slice: -limit } })
      .lean()

    sendSuccess(res, 'Chat history fetched', session?.messages ?? [])
  } catch (err) { next(err) }
})

// ─── DELETE /api/ai/history ───────────────────────────────────────────────────

router.delete('/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ChatSession.findOneAndUpdate(
      { userId: req.user!.userId },
      { $set: { messages: [] } }
    )
    sendSuccess(res, 'Chat history cleared')
  } catch (err) { next(err) }
})

// ─── GET /api/ai/anomalies ────────────────────────────────────────────────────

router.get('/anomalies', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("fetching anomalies for userId", req.user!.userId)
    const anomalies = await Anomaly.find({ userId: req.user!.userId })
      .sort({ detectedAt: -1 })
      .limit(20)
      .lean()

    sendSuccess(res, 'Anomalies fetched', anomalies)
  } catch (err) { next(err) }
})

// ─── PATCH /api/ai/anomalies/:id/seen ─────────────────────────────────────────

router.patch('/anomalies/:id/seen', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Anomaly.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { $set: { seen: true } }
    )
    sendSuccess(res, 'Anomaly marked as seen')
  } catch (err) { next(err) }
})

export default router