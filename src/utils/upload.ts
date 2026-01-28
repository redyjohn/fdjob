/**
 * 上傳前驗證：size（Attachment.csv）、mimeType 白名單
 */

import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_ERROR_MESSAGE } from './toast'

/** 允許的 mimeType（圖片、PDF、Word） */
const ALLOWED_MIME_PREFIXES = [
  'image/',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
]

export function isAllowedMimeType(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.toLowerCase().startsWith(p))
}

export interface UploadValidationResult {
  ok: boolean
  error?: string
}

export function validateFileBeforeUpload(file: File): UploadValidationResult {
  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    return { ok: false, error: FILE_SIZE_ERROR_MESSAGE }
  }
  const mime = file.type || ''
  if (!mime || !isAllowedMimeType(mime)) {
    return {
      ok: false,
      error: '不支援的檔案格式，僅允許圖片、PDF、Word（.doc / .docx）。'
    }
  }
  return { ok: true }
}
