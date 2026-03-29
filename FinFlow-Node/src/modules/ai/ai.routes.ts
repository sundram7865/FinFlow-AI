import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { streamAgentResponse } from '../../utils/python.bridge'
import { Chat }    from './models/Chat.model'
import { Message } from './models/Message.model'
import { Anomaly } from './models/Anomaly.model'
import { sendSuccess, sendError } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'
import redis from '../../config/redis'

const router = Router()
router.use(authenticate)

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    chatId:  z.string().optional(),
  }),
})

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { body }  = chatSchema.parse({ body: req.body })
    const userId    = req.user!.userId
    let   chatId    = body.chatId

    // Create new chat if no chatId provided
    if (!chatId) {
      chatId = uuidv4()
      await Chat.create({ chatId, userId, title: 'New Chat' })
    }

    // Send chatId back in header so frontend knows which chat this belongs to
    res.setHeader('X-Chat-Id', chatId)

    await streamAgentResponse(userId, chatId, body.message, res)
  } catch (err) { next(err) }
})

// ─── GET /api/ai/chats ────────────────────────────────────────────────────────

router.get('/chats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const chats = await Chat.find({ userId: req.user!.userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()
    sendSuccess(res, 'Chats fetched', chats)
  } catch (err) { next(err) }
})

// ─── GET /api/ai/chats/:chatId/messages ───────────────────────────────────────

router.get('/chats/:chatId/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    const page  = parseInt(req.query.page as string)  || 1
    const limit = parseInt(req.query.limit as string) || 20

    // Verify ownership
    const chat = await Chat.findOne({ chatId, userId: req.user!.userId })
    if (!chat) { sendError(res, 'Chat not found', 404); return }

    const [messages, total] = await Promise.all([
      Message.find({ chatId })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .then(msgs => msgs.reverse()),
      Message.countDocuments({ chatId }),
    ])

    sendSuccess(res, 'Messages fetched', { messages, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

// ─── DELETE /api/ai/chats/:chatId ─────────────────────────────────────────────

router.delete('/chats/:chatId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    await Promise.all([
      Chat.deleteOne({ chatId, userId: req.user!.userId }),
      Message.deleteMany({ chatId }),
    ])
    sendSuccess(res, 'Chat deleted')
  } catch (err) { next(err) }
})

// ─── GET /api/ai/anomalies ────────────────────────────────────────────────────

router.get('/anomalies', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
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