import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import {
  listAnomalies,
  anomalySummary,
  seenAnomaly,
  seenAllAnomalies,
  removeAnomaliesByUpload,
} from './anomalies.controller'

const router = Router()

// All anomaly routes require authentication
router.use(authenticate)

// ── READ ──────────────────────────────────────────────────────────────────────
// GET  /api/anomalies             → paginated list (filterable by severity/seen/date)
// GET  /api/anomalies/summary     → { low, medium, high, unseen } badge counts
router.get('/',        listAnomalies)
router.get('/summary', anomalySummary)

// ── MARK SEEN ─────────────────────────────────────────────────────────────────
// PATCH /api/anomalies/seen-all   → mark all unseen as seen
// PATCH /api/anomalies/:id/seen   → mark one as seen
router.patch('/seen-all',   seenAllAnomalies)
router.patch('/:id/seen',   seenAnomaly)

// ── DELETE ────────────────────────────────────────────────────────────────────
// DELETE /api/anomalies/upload/:uploadId → wipe anomalies for a specific upload
router.delete('/upload/:uploadId', removeAnomaliesByUpload)

export default router