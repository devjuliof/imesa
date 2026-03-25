// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

// Default company slug for development
// In production, this should be configured per tablet
export const DEFAULT_COMPANY_SLUG = 'demo'

// App configuration
export const APP_CONFIG = {
  // Minimum touch target size (accessibility)
  MIN_TOUCH_TARGET: 48,

  // Cache duration in milliseconds
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // API timeout
  API_TIMEOUT: 10000, // 10 seconds
}
