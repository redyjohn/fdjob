/**
 * 簡易錯誤提示（Toast / Alert）
 * 發送失敗、429 等時於 UI 顯示；若 API 回傳 traceId 則一併顯示，方便除錯與日誌追蹤。
 */

export function showError(message: string, traceId?: string): void {
  const text = traceId ? `${message}\n(traceId: ${traceId})` : message
  alert(text)
}

export const RATE_LIMIT_MESSAGE = '請求頻繁，請稍候。'

/** 附件上傳大小上限（10MB） */
export const FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024

/** 檔案過大時的錯誤提示 */
export const FILE_SIZE_ERROR_MESSAGE = '檔案過大，請選擇 10MB 以下的檔案。'
