// Application configuration utility
// Reads configuration from window.APP_CONFIG (defined in public/config.js)

interface AppConfig {
  API_URL: string
  WS_URL: string
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig
  }
}

// Get API base URL from config or fallback to default
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) {
    return window.APP_CONFIG.API_URL
  }
  // Fallback for development
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

// Get WebSocket URL from config or fallback to default
export function getWebSocketUrl(): string {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.WS_URL) {
    return window.APP_CONFIG.WS_URL
  }
  // Fallback for development
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
