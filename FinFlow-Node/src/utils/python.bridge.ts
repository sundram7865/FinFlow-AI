import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/db.postgres'
import { Chat }        from '../modules/ai/models/Chat.model'
import { Message }     from '../modules/ai/models/Message.model'
import { AgentMemory } from '../modules/ai/models/AgentMemory.model'
import { RawAnomaly }  from '../modules/anomalies/anomalies.service'
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
  // Save user message
  await Message.create({
    messageId: uuidv4(),
    chatId,
    userId,
    role:      'user',
    content:   message,
    timestamp: new Date(),
  })

  // Update chat title on first message
  const msgCount = await Message.countDocuments({ chatId })
  if (msgCount === 1) {
    await Chat.findOneAndUpdate({ chatId }, { title: message.slice(0, 50) })
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

  const reader  = pythonRes.body!.getReader()
  const decoder = new TextDecoder()

  const contentLines: string[] = []
  let   metaJson: string | null = null
  let   buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const rawLines = buffer.split('\n\n')
    buffer = rawLines.pop() ?? ''

    for (const block of rawLines) {
      if (!block.trim()) continue

      const token = block.replace(/^data:\s?/, '').trim()
      if (!token) continue

      if (token === '[DONE]') {
        res.write('data: [DONE]\n\n')
        continue
      }

      if (token.startsWith('[META]')) {
        try { metaJson = token.slice(6) } catch (e) { console.error('META extract error:', e) }
        continue
      }

      contentLines.push(token)
      res.write(`data: ${token}\n\n`)
    }
  }

  res.end()

  // ── Save assistant message ───────────────────────────────
  const cleanContent = contentLines.join('\n').trim()
  await Message.create({
    messageId: uuidv4(),
    chatId,
    userId,
    role:      'assistant',
    content:   cleanContent,
    timestamp: new Date(),
  })

  // ── Process metadata — memories only, anomalies removed ─
  // Anomalies are detected once at upload time, never via chat.
  if (metaJson) {
    try {
      const meta = JSON.parse(metaJson)

      if (meta.new_memories?.length) {
        await AgentMemory.findOneAndUpdate(
          { userId },
          {
            $push: {
              memories: {
                $each: meta.new_memories.map((m: any) => ({ ...m, createdAt: new Date() })),
              },
            },
          },
          { upsert: true }
        )
      }

      // ✅ meta.anomalies intentionally NOT processed here
    } catch (e) {
      console.error('META parse error:', e)
    }
  }
}

// ─── PDF PARSING ──────────────────────────────────────────────────────────────

export const parsePdfStatement = async (
  userId:   string,
  fileUrl:  string,
  uploadId: string
): Promise<{ transactions: object[] }> => {
  const res = await fetch(`${FASTAPI_URL}/parse/statement`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-User-Id':      userId,
      'X-Internal-Key': FASTAPI_INTERNAL_KEY,
    },
    body: JSON.stringify({ userId, fileUrl, uploadId }),
  })
  if (!res.ok) throw new Error(`PDF parse failed: ${res.status}`)
  return res.json() as Promise<{ transactions: object[] }>
}

// ─── ANOMALY DETECTION ────────────────────────────────────────────────────────

/**
 * Sends parsed transactions to Python's dedicated anomaly detection endpoint.
 * Called once per upload — never from the chat pipeline.
 */
export const detectAnomaliesViaBridge = async (
  userId:       string,
  uploadId:     string,
  transactions: object[]
): Promise<RawAnomaly[]> => {
  const res = await fetch(`${FASTAPI_URL}/analyze/anomalies`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-Internal-Key': FASTAPI_INTERNAL_KEY,
    },
    body: JSON.stringify({ userId, uploadId, transactions }),
  })

  if (!res.ok) throw new Error(`Anomaly detection failed: ${res.status}`)

  const body = await res.json() as { anomalies: RawAnomaly[] }
  return body.anomalies ?? []
}

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────────

export const generateMonthlyReport = async (
  userId: string,
  month:  number,
  year:   number
): Promise<{ fileUrl: string; summary: string }> => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt:  new Date(year, month, 1),
      },
    },
  })
  const res = await fetch(`${FASTAPI_URL}/report/generate`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-User-Id':      userId,
      'X-Internal-Key': FASTAPI_INTERNAL_KEY,
    },
    body: JSON.stringify({ userId, month, year, transactions }),
  })
  if (!res.ok) throw new Error(`Report generation failed: ${res.status}`)
  return res.json() as Promise<{ fileUrl: string; summary: string }>
}