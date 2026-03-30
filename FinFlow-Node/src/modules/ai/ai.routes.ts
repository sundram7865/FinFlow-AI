import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { streamAgentResponse } from '../../utils/python.bridge'
import { Chat }    from './models/Chat.model'
import { Message } from './models/Message.model'

import { sendSuccess, sendError } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'


const router = Router()
router.use(authenticate)

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    chatId: z.string().nullable().optional() ,
  }),
})

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Received chat request:', { body: req.body, userId: req.user!.userId })
    const { body }  = chatSchema.parse({ body: req.body })
    const userId    = req.user!.userId
    let   chatId    = body.chatId

    // Create new chat if no chatId provided
    if (!chatId) {
      chatId = uuidv4()
      await Chat.create({ chatId, userId, title: 'New Chat' })
    }
    console.log('Using chatId:', chatId)
    // Send chatId back in header so frontend knows which chat this belongs to
    res.setHeader('X-Chat-Id', chatId)
    console.log('Starting to stream agent response...')
    await streamAgentResponse(userId, chatId, body.message, res)
    console.log('Finished streaming agent response')
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



export default router