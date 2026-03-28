import { Response, NextFunction } from 'express'
import multer from 'multer'
import { Router } from 'express'
import * as uploadService from './upload.service'
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'

// Multer config — memory storage, PDF only, 10MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files are allowed'))
  },
})

// POST /api/upload/statement
const uploadStatement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400)
      return
    }
    const result = await uploadService.uploadStatement(req.user!.userId, req.file)
    sendCreated(res, result.message, { uploadId: result.uploadId })
  } catch (err) { next(err) }
}

// GET /api/upload
const listUploads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uploads = await uploadService.listUploads(req.user!.userId)
    sendSuccess(res, 'Uploads fetched', uploads)
  } catch (err) { next(err) }
}

// GET /api/upload/:id/status
const getStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const upload = await uploadService.getUploadStatus(req.user!.userId, req.params.id)
    sendSuccess(res, 'Upload status fetched', upload)
  } catch (err) { next(err) }
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

const router = Router()
router.use(authenticate)

router.post('/statement',       upload.single('file'), uploadStatement)
router.get('/',                 listUploads)
router.get('/:id/status',       getStatus)

export default router