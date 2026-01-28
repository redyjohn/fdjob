/**
 * 簡易錯誤提示（Toast / Alert）
 * 發送失敗、429 等時於 UI 顯示。
 */

export function showError(message: string): void {
  alert(message)
}

export const RATE_LIMIT_MESSAGE = '請求頻繁，請稍候。'

/** 附件上傳大小上限（10MB） */
export const FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024

/** 檔案過大時的錯誤提示 */
export const FILE_SIZE_ERROR_MESSAGE = '檔案過大，請選擇 10MB 以下的檔案。'
