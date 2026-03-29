import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/db.postgres'
import { Chat }        from '../modules/ai/models/Chat.model'
import { Message }     from '../modules/ai/models/Message.model'
import { AgentMemory } from '../modules/ai/models/AgentMemory.model'
import { Anomaly }     from '../modules/ai/models/Anomaly.model'
import { PythonChatPayload } from '../types'

const FASTAPI_URL          = process.env.FASTAPI_URL          as string
const FASTAPI_INTERNAL_KEY = process.env.FASTAPI_INTERNAL_KEY as string

// ─── BUILD PAYLOAD ────────────────────────────────────────────────────────────

const buildPayload = async (
  userId: string,
  chatId: string,
  message: string
): Promise<PythonChatPayload> => {
  const [goals, recentMessages, agentMemory] = await Promise.all([
    prisma.goal.findMany({ where: { userId }, include: { milestones: true } }),
    // Fetch last 10 messages for this specific chat — context windowing
    Message.find({ chatId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean()
      .then(msgs => msgs.reverse()),
    AgentMemory.findOne({ userId }).lean(),
  ])

  return {
    message,
    userId,
    chatId,
    goals,
    chat_history: recentMessages.map(m => ({
      role:      m.role,
      content:   m.content,
      agentUsed: m.agentUsed,
      timestamp: m.timestamp.toISOString(),
    })),
    memory: (agentMemory as any)?.memories ?? [],
  }
}

// ─── STREAM AGENT RESPONSE ────────────────────────────────────────────────────

export const streamAgentResponse = async (
  userId:  string,
  chatId:  string,
  message: string,
  res:     Response
): Promise<void> => {
  // Save user message first
  await Message.create({
    messageId: uuidv4(),
    chatId,
    userId,
    role:    'user',
    content: message,
    timestamp: new Date(),
  })

  // Update chat title from first message
  const msgCount = await Message.countDocuments({ chatId })
  if (msgCount === 1) {
    await Chat.findOneAndUpdate(
      { chatId },
      { title: message.slice(0, 50) }
    )
  }

  const payload = await buildPayload(userId, chatId, message)

  const pythonRes = await fetch(`${FASTAPI_URL}/agent/chat`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-User-Id':      userId,
      'X-Internal-Key': FASTAPI_INTERNAL_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!pythonRes.ok) throw new Error(`FastAPI error: ${pythonRes.status}`)

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.flushHeaders()

  let fullResponse = ''
  const reader  = pythonRes.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    fullResponse += chunk
    res.write(chunk)
  }

  res.end()

  // Parse META and save AI response
  const metaIndex = fullResponse.lastIndexOf('[META]')
  let   aiContent = fullResponse

  if (metaIndex !== -1) {
    aiContent = fullResponse.substring(0, metaIndex)
    try {
      const metaStr  = fullResponse.substring(metaIndex + 6)
      const jsonStr  = metaStr.substring(metaStr.indexOf('{'), metaStr.lastIndexOf('}') + 1)
      const meta     = JSON.parse(jsonStr)

      if (meta.new_memories?.length) {
        await AgentMemory.findOneAndUpdate(
          { userId },
          { $push: { memories: { $each: meta.new_memories.map((m: any) => ({ ...m, createdAt: new Date() })) } } },
          { upsert: true }
        )
      }

      if (meta.anomalies?.length) {
        await Anomaly.insertMany(
          meta.anomalies.map((a: any) => ({ userId, ...a, detectedAt: new Date(), seen: false }))
        )
      }
    } catch (e) {
      console.error('META parse error:', e)
    }
  }

  // Save AI response as separate message
  await Message.create({
    messageId: uuidv4(),
    chatId,
    userId,
    role:      'assistant',
    content:   aiContent.replace(/^data: /gm, '').replace('[DONE]', '').trim(),
    timestamp: new Date(),
  })
}