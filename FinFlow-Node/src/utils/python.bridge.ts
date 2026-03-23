import { Response } from 'express'
import prisma from '../config/db.postgres'
import { ChatSession } from '../modules/ai/models/ChatSession.model'
import { AgentMemory } from '../modules/ai/models/AgentMemory.model'
import { PythonChatPayload } from '../types'

const FASTAPI_URL         = process.env.FASTAPI_URL         as string
const FASTAPI_INTERNAL_KEY = process.env.FASTAPI_INTERNAL_KEY as string

// ─── FETCH ALL USER CONTEXT FROM BOTH DBS ────────────────────────────────────

const buildPayload = async (
  userId: string,
  message: string
): Promise<PythonChatPayload> => {
  // PostgreSQL — structured data
  const [transactions, goals] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
      take:    50,
    }),
    prisma.goal.findMany({
      where:   { userId },
      include: { milestones: true },
    }),
  ])

  // MongoDB — AI memory and chat history
  const [chatSession, agentMemory] = await Promise.all([
    ChatSession.findOne({ userId }).lean(),
    AgentMemory.findOne({ userId }).lean(),
  ])

  return {
    message,
    userId,
    transactions,
    goals,
    chat_history: chatSession?.messages ?? [],
    memory:       (agentMemory as any)?.memories ?? [],
  }
}

// ─── CALL PYTHON AND STREAM RESPONSE BACK ────────────────────────────────────

export const streamAgentResponse = async (
  userId: string,
  message: string,
  res: Response
): Promise<void> => {
  const payload = await buildPayload(userId, message)

  const pythonRes = await fetch(`${FASTAPI_URL}/agent/chat`, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-User-Id':       userId,
      'X-Internal-Key':  FASTAPI_INTERNAL_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!pythonRes.ok) {
    throw new Error(`FastAPI error: ${pythonRes.status}`)
  }

  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.flushHeaders()

  // Collect full response while streaming
  let fullResponse = ''
  const reader = pythonRes.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    fullResponse += chunk
    res.write(chunk)
  }

  res.end()

  // Save conversation to MongoDB after streaming finishes
  await saveChatMessages(userId, message, fullResponse)
}

// ─── SAVE MESSAGES TO MONGO ───────────────────────────────────────────────────

export const saveChatMessages = async (
  userId: string,
  userMessage: string,
  aiMessage: string
): Promise<void> => {
  await ChatSession.findOneAndUpdate(
    { userId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user',      content: userMessage, timestamp: new Date() },
            { role: 'assistant', content: aiMessage,   timestamp: new Date() },
          ],
        },
      },
    },
    { upsert: true, new: true }
  )
}

// ─── CALL PYTHON FOR PDF PARSING (non-streaming) ──────────────────────────────

export const parsePdfStatement = async (
  userId: string,
  fileUrl: string,
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
  return res.json()
}

// ─── CALL PYTHON TO GENERATE REPORT (non-streaming) ──────────────────────────

export const generateMonthlyReport = async (
  userId: string,
  month: number,
  year: number
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
  return res.json()
}