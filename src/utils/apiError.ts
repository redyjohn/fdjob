/**
 * API 錯誤型別
 * 用於 401/403/404/429/5xx 分支處理；429 時 UI 提示「請求頻繁，請稍候」。
 */

export class ApiError extends Error {
  readonly status: number | undefined
  readonly traceId: string | undefined

  constructor(message: string, status?: number, traceId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.traceId = traceId
  }

  get isRateLimit(): boolean {
    return this.status === 429
  }
}
