import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

  // Android emulator uses 10.0.2.2 to access host's localhost
  if (__DEV__ && Platform.OS === 'android') {
    return envUrl.replace(/192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|localhost/, '10.0.2.2')
  }

  return envUrl
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Transform image URLs for Android emulator compatibility
 * Replaces localhost/127.0.0.1 with 10.0.2.2 for Android emulator
 */
export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null

  if (__DEV__ && Platform.OS === 'android') {
    return url.replace(/127\.0\.0\.1|localhost/, '10.0.2.2')
  }

  return url
}

if (__DEV__) {
  console.log('[API] Platform:', Platform.OS)
  console.log('[API] Base URL:', API_BASE_URL)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add terminal token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const terminalToken = await AsyncStorage.getItem('terminal-token')
      if (terminalToken) {
        config.headers.Authorization = `Bearer ${terminalToken}`
      }
    } catch {
      // Ignore storage errors
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (__DEV__) {
      console.error('API Error:', error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)
