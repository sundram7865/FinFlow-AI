import crypto from 'crypto'
import { Anomaly } from './Anomaly.model'
import { AppError } from '../../middleware/error.middleware'
import { detectAnomaliesViaBridge } from '../../utils/python.bridge'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RawAnomaly {
  amount:      number
  category:    string
  date?:       string
  avg:         number
  zScore:      number
  rank:        string
  description: string
  severity:    'low' | 'medium' | 'high'
}

export interface AnomalyFilters {
  severity?: 'low' | 'medium' | 'high'
  seen?:     boolean
  from?:     Date
  to?:       Date
  limit?:    number
  offset?:   number
}

// Plain object shape returned from .lean() — avoids FlattenMaps<IAnomaly> cast errors
export interface AnomalyDoc {
  _id:         string
  userId:      string
  uploadId:    string
  fingerprint: string
  description: string
  severity:    'low' | 'medium' | 'high'
  detectedAt:  Date
  seen:        boolean
}

interface DetectionResult {
  saved:      number
  duplicates: number
  failed:     boolean
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Stable SHA-256 fingerprint for deduplication.
 * Same transaction always produces the same hash regardless of re-upload.
 */
const buildFingerprint = (a: RawAnomaly): string =>
  crypto
    .createHash('sha256')
    .update(`${a.amount}::${a.category}::${a.date ?? 'no-date'}`)
    .digest('hex')

// ─── DETECT & SAVE ────────────────────────────────────────────────────────────

/**
 * Called ONCE after PDF upload is parsed and transactions are saved.
 * Sends transactions to Python, fingerprints results, bulk-inserts with
 * duplicate suppression via the compound unique index.
 *
 * NEVER called from the chat pipeline.
 */
export const detectAndSaveAnomalies = async (
  userId:       string,
  uploadId:     string,
  transactions: object[]
): Promise<DetectionResult> => {
  // ── delegate to python bridge ────────────────────────────
  let rawAnomalies: RawAnomaly[]

  try {
    rawAnomalies = await detectAnomaliesViaBridge(userId, uploadId, transactions)
  } catch (err) {
    // Detection failure must NOT fail the upload pipeline
    console.error('[AnomalyService] Detection bridge failed:', err)
    return { saved: 0, duplicates: 0, failed: true }
  }

  if (!rawAnomalies.length) {
    return { saved: 0, duplicates: 0, failed: false }
  }

  // ── build documents ──────────────────────────────────────
  const docs = rawAnomalies.map((a) => ({
    userId,
    uploadId,
    fingerprint: buildFingerprint(a),
    description: a.description,
    severity:    a.severity,
    detectedAt:  new Date(),
    seen:        false,
  }))

  // ── bulk insert — skip duplicates silently (E11000) ──────
  let saved      = 0
  let duplicates = 0

  try {
    const result = await Anomaly.insertMany(docs, {
      ordered:   false, // continue batch even if some docs fail
      rawResult: true,
    })
    saved = (result as any).insertedCount ?? docs.length
  } catch (err: any) {
    if (err.code === 11000 || err.writeErrors?.length) {
      const writeErrors: any[] = err.writeErrors ?? []
      duplicates = writeErrors.filter((e: any) => e.code === 11000).length
      saved      = docs.length - duplicates

      const otherErrors = writeErrors.filter((e: any) => e.code !== 11000)
      if (otherErrors.length) {
        console.error('[AnomalyService] Non-duplicate write errors:', otherErrors)
      }
    } else {
      console.error('[AnomalyService] insertMany failed:', err)
      return { saved: 0, duplicates: 0, failed: true }
    }
  }

  console.info(
    `[AnomalyService] uploadId=${uploadId} saved=${saved} duplicates=${duplicates}`
  )

  return { saved, duplicates, failed: false }
}

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Paginated, filterable anomaly list for a user.
 */
export const getAnomalies = async (
  userId:  string,
  filters: AnomalyFilters = {}
): Promise<{ anomalies: AnomalyDoc[]; total: number }> => {
  const { severity, seen, from, to, limit = 20, offset = 0 } = filters

  const query: Record<string, any> = { userId }

  if (severity)           query.severity   = severity
  if (seen !== undefined) query.seen       = seen
  if (from || to) {
    query.detectedAt = {}
    if (from) query.detectedAt.$gte = from
    if (to)   query.detectedAt.$lte = to
  }

  const [anomalies, total] = await Promise.all([
    Anomaly.find(query)
      .sort({ detectedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean<AnomalyDoc[]>(),
    Anomaly.countDocuments(query),
  ])

  return { anomalies, total }
}

/**
 * Severity breakdown + unseen count — for dashboard badges.
 * Single aggregation round-trip.
 */
export const getAnomalySummary = async (
  userId: string
): Promise<{ low: number; medium: number; high: number; unseen: number }> => {
  const [counts, unseen] = await Promise.all([
    Anomaly.aggregate([
      { $match: { userId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    Anomaly.countDocuments({ userId, seen: false }),
  ])

  const summary = { low: 0, medium: 0, high: 0, unseen }
  for (const row of counts) {
    summary[row._id as 'low' | 'medium' | 'high'] = row.count
  }

  return summary
}

// ─── MARK SEEN ────────────────────────────────────────────────────────────────

/**
 * Marks a single anomaly as seen. Validates ownership before write.
 */
export const markAnomalySeen = async (
  userId:    string,
  anomalyId: string
): Promise<void> => {
  const anomaly = await Anomaly.findById(anomalyId).lean()
  if (!anomaly)                  throw new AppError('Anomaly not found', 404)
  if (anomaly.userId !== userId) throw new AppError('Forbidden', 403)

  await Anomaly.findByIdAndUpdate(anomalyId, { $set: { seen: true } })
}

/**
 * Marks ALL unseen anomalies for a user as seen — one atomic write.
 */
export const markAllAnomaliesSeen = async (
  userId: string
): Promise<{ updated: number }> => {
  const result = await Anomaly.updateMany(
    { userId, seen: false },
    { $set: { seen: true } }
  )
  return { updated: result.modifiedCount }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Wipes all anomalies tied to a specific upload.
 * Call this before re-processing an upload so fresh anomalies replace old ones.
 */
export const deleteAnomaliesByUpload = async (
  userId:   string,
  uploadId: string
): Promise<{ deleted: number }> => {
  const result = await Anomaly.deleteMany({ userId, uploadId })
  return { deleted: result.deletedCount }
}