import { Router, Response, NextFunction } from 'express'
import prisma from '../../config/db.postgres'
import { generateMonthlyReport } from '../../utils/python.bridge'
import { AppError } from '../../middleware/error.middleware'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const listReports = async (userId: string) => {
  return prisma.report.findMany({
    where:   { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export const triggerReportGeneration = async (
  userId: string,
  month: number,
  year: number
) => {
  // Check if report already exists
  const existing = await prisma.report.findUnique({
    where: { userId_month_year: { userId, month, year } },
  })
  if (existing) throw new AppError('Report for this month already exists', 409)

  // Call Python to generate
  const { fileUrl, summary } = await generateMonthlyReport(userId, month, year)

  return prisma.report.create({
    data: { userId, month, year, fileUrl, summary },
  })
}

// ─── CONTROLLER + ROUTER ──────────────────────────────────────────────────────

const router = Router()
router.use(authenticate)

// GET /api/reports
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await listReports(req.user!.userId)
    sendSuccess(res, 'Reports fetched', reports)
  } catch (err) { next(err) }
})

// POST /api/reports/generate
router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month  = parseInt(req.body.month) || new Date().getMonth() + 1
    const year   = parseInt(req.body.year)  || new Date().getFullYear()
    const report = await triggerReportGeneration(req.user!.userId, month, year)
    sendSuccess(res, 'Report generated', report)
  } catch (err) { next(err) }
})

export default router