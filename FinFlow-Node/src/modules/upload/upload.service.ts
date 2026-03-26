import { v2 as cloudinary } from 'cloudinary'
import prisma from '../../config/db.postgres'
import { parsePdfStatement } from '../../utils/python.bridge'
import { bulkInsertTransactions } from '../transactions/transactions.service'
import { AppError } from '../../middleware/error.middleware'
import { CreateTransactionInput } from '../transactions/transactions.validator'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── UPLOAD PDF TO CLOUDINARY ────────────────────────────────────────────────

export const uploadStatement = async (
  userId: string,
  file: Express.Multer.File
): Promise<{ uploadId: string; message: string }> => {
  // Upload to cloudinary
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
    folder: `finflow/${userId}`,
    resource_type: 'raw',
    type: 'upload',
    access_mode: 'public'
  },
      (err, res) => {
        if (err || !res) reject(err ?? new Error('Upload failed'))
        else resolve(res as { secure_url: string })
      }
    )
    stream.end(file.buffer)
  })

  // Save upload record in PostgreSQL
  const upload = await prisma.upload.create({
    data: {
      userId,
      fileName: file.originalname,
      fileUrl:  result.secure_url,
      fileSize: file.size,
      status:   'PENDING',
    },
  })

  // Trigger async parsing (non-blocking)
  processPdfAsync(userId, upload.id, result.secure_url).catch(err =>
    console.error('PDF processing error:', err)
  )

  return { uploadId: upload.id, message: 'File uploaded. Processing started.' }
}

// ─── ASYNC PDF PARSING ────────────────────────────────────────────────────────

const processPdfAsync = async (
  userId: string,
  uploadId: string,
  fileUrl: string
): Promise<void> => {
  try {
    // Mark as processing
    await prisma.upload.update({ where: { id: uploadId }, data: { status: 'PROCESSING' } })

    // Call Python to parse PDF
    const { transactions } = await parsePdfStatement(userId, fileUrl, uploadId)

    // Bulk insert parsed transactions into PostgreSQL
    await bulkInsertTransactions(userId, transactions as CreateTransactionInput[])

    // Mark as done
    await prisma.upload.update({
      where: { id: uploadId },
      data:  { status: 'DONE', parsedAt: new Date() },
    })
  } catch (err) {
    await prisma.upload.update({ where: { id: uploadId }, data: { status: 'FAILED' } })
    throw err
  }
}

// ─── LIST UPLOADS ─────────────────────────────────────────────────────────────

export const listUploads = async (userId: string) => {
  return prisma.upload.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      fileName:  true,
      status:    true,
      parsedAt:  true,
      createdAt: true,
    },
  })
}

// ─── GET UPLOAD STATUS ────────────────────────────────────────────────────────

export const getUploadStatus = async (userId: string, uploadId: string) => {
  const upload = await prisma.upload.findUnique({ where: { id: uploadId } })
  if (!upload)               throw new AppError('Upload not found', 404)
  if (upload.userId !== userId) throw new AppError('Forbidden', 403)
  return upload
}