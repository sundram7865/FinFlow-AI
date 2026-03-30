import {  Response, NextFunction } from 'express'
import {
  getAnomalies,
  getAnomalySummary,
  markAnomalySeen,
  markAllAnomaliesSeen,
  deleteAnomaliesByUpload,
} from './anomalies.service'
import { AnomalyFilters } from './anomalies.service'
import { AuthRequest } from '../../types'

// ─── GET /anomalies ───────────────────────────────────────────────────────────

export const listAnomalies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId

    const filters: AnomalyFilters = {
      severity: req.query.severity as AnomalyFilters['severity'],
      seen:     req.query.seen !== undefined ? req.query.seen === 'true' : undefined,
      from:     req.query.from ? new Date(req.query.from as string) : undefined,
      to:       req.query.to   ? new Date(req.query.to   as string) : undefined,
      limit:    req.query.limit  ? parseInt(req.query.limit  as string) : 20,
      offset:   req.query.offset ? parseInt(req.query.offset as string) : 0,
    }

    const result = await getAnomalies(userId, filters)

    res.json({
      success: true,
      data:    result.anomalies,
      meta: {
        total:  result.total,
        limit:  filters.limit,
        offset: filters.offset,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /anomalies/summary ───────────────────────────────────────────────────

export const anomalySummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await getAnomalySummary(req.user!.userId)
    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /anomalies/:id/seen ────────────────────────────────────────────────

export const seenAnomaly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await markAnomalySeen(req.user!.userId, req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /anomalies/seen-all ────────────────────────────────────────────────

export const seenAllAnomalies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await markAllAnomaliesSeen(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /anomalies/upload/:uploadId ───────────────────────────────────────

export const removeAnomaliesByUpload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteAnomaliesByUpload(req.user!.userId, req.params.uploadId)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}