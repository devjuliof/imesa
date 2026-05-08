import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Platform } from 'react-native'
import { useConfigStore } from '../stores/configStore'
import { useOrderStore } from '../stores/orderStore'
import { useCartStore } from '../stores/cartStore'

const getSocketUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

  if (__DEV__ && Platform.OS === 'android') {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2')
  }

  return envUrl
}

interface SessionClosedPayload {
  sessionId: string
  tableId: string
}

interface UseSessionSocketReturn {
  isConnected: boolean
  sessionClosed: boolean
  clearSessionClosed: () => void
}

/**
 * WebSocket hook for tablets to receive session lifecycle events.
 * Connects to the /tables namespace using device-based auth (deviceId + tableId).
 * When session:closed or session:auto_closed is received for this tablet's table,
 * clears all local state (orders, cart) and sets sessionClosed flag.
 */
export const useSessionSocket = (): UseSessionSocketReturn => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)

  const tableId = useConfigStore((state) => state.tableId)
  const deviceId = useConfigStore((state) => state.deviceId)
  const isConfigured = useConfigStore((state) => state.isConfigured)

  const clearAllOrders = useOrderStore((state) => state.clearAllOrders)
  const clearCart = useCartStore((state) => state.clearCart)

  // Refs to avoid stale closures in event handlers
  const tableIdRef = useRef(tableId)
  const clearAllOrdersRef = useRef(clearAllOrders)
  const clearCartRef = useRef(clearCart)

  useEffect(() => {
    tableIdRef.current = tableId
  }, [tableId])

  useEffect(() => {
    clearAllOrdersRef.current = clearAllOrders
  }, [clearAllOrders])

  useEffect(() => {
    clearCartRef.current = clearCart
  }, [clearCart])

  const clearSessionClosed = useCallback(() => {
    setSessionClosed(false)
  }, [])

  const handleSessionClosed = useCallback((payload: SessionClosedPayload) => {
    if (__DEV__) {
      console.log('[SessionSocket] session:closed received', payload)
    }

    // Only react if this event is for our table
    if (payload.tableId === tableIdRef.current) {
      if (__DEV__) {
        console.log('[SessionSocket] Matches our table, clearing state')
      }

      // Clear all local state
      clearAllOrdersRef.current()
      clearCartRef.current()

      // Signal to the UI that session was closed
      setSessionClosed(true)
    }
  }, [])

  useEffect(() => {
    // Only connect if the tablet is configured with a tableId and deviceId
    if (!isConfigured || !tableId || !deviceId) {
      if (__DEV__) {
        console.log('[SessionSocket] Not configured, skipping connection')
      }
      return
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) {
      return
    }

    const socketUrl = getSocketUrl()

    if (__DEV__) {
      console.log(`[SessionSocket] Connecting to ${socketUrl}/tables...`)
    }

    const socket = io(`${socketUrl}/tables`, {
      transports: ['websocket', 'polling'],
      auth: {
        deviceId,
        tableId,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      if (__DEV__) {
        console.log(`[SessionSocket] Connected! Socket ID: ${socket.id}`)
      }
    })

    socket.on('authenticated', (data: { companyId: string; tableId?: string }) => {
      if (__DEV__) {
        console.log('[SessionSocket] Authenticated', data)
      }
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      if (__DEV__) {
        console.log(`[SessionSocket] Disconnected: ${reason}`)
      }
      setIsConnected(false)

      // If the server kicked us, try to reconnect
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    })

    socket.on('connect_error', (error) => {
      if (__DEV__) {
        console.log(`[SessionSocket] Connection error: ${error.message}`)
      }
    })

    // Listen for session closed events
    socket.on('session:closed', handleSessionClosed)
    socket.on('session:auto_closed', handleSessionClosed)

    return () => {
      if (__DEV__) {
        console.log('[SessionSocket] Disconnecting...')
      }
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isConfigured, tableId, deviceId, handleSessionClosed])

  return {
    isConnected,
    sessionClosed,
    clearSessionClosed,
  }
}
