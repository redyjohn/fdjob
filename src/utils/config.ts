// Application configuration utility
// API / WebSocket 網址優先從 window.APP_CONFIG 讀取（public/config.js）。
// 僅當 config.js 未載入或未設定時使用 Fallback；環境變數僅供測試與檢測使用。

interface AppConfig {
  API_URL: string
  WS_URL: string
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) {
    return window.APP_CONFIG.API_URL
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

export function getWebSocketUrl(): string {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.WS_URL) {
    return window.APP_CONFIG.WS_URL
  }
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
}

// Get full API URL for a specific endpoint
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure baseUrl doesn't end with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBaseUrl}/${cleanEndpoint}`
}
