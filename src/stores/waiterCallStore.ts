import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface WaiterCall {
  id: string
  tableNumber: string
  companySlug: string
  type: 'call' | 'bill'
  timestamp: string
  status: 'pending' | 'acknowledged'
}

interface WaiterCallState {
  calls: WaiterCall[]
}

interface WaiterCallActions {
  addCall: (call: Omit<WaiterCall, 'id' | 'timestamp' | 'status'>) => string
  acknowledgeCall: (id: string) => void
  clearCall: (id: string) => void
  clearAllCalls: () => void
  getPendingCalls: () => WaiterCall[]
}

type WaiterCallStore = WaiterCallState & WaiterCallActions

const generateCallId = () => {
  return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useWaiterCallStore = create<WaiterCallStore>()(
  persist(
    (set, get) => ({
      calls: [],

      addCall: (call) => {
        const id = generateCallId()
        const newCall: WaiterCall = {
          ...call,
          id,
          timestamp: new Date().toISOString(),
          status: 'pending',
        }
        set((state) => ({
          calls: [newCall, ...state.calls],
        }))
        return id
      },

      acknowledgeCall: (id) => {
        set((state) => ({
          calls: state.calls.map((call) =>
            call.id === id ? { ...call, status: 'acknowledged' as const } : call
          ),
        }))
      },

      clearCall: (id) => {
        set((state) => ({
          calls: state.calls.filter((call) => call.id !== id),
        }))
      },

      clearAllCalls: () => {
        set({ calls: [] })
      },

      getPendingCalls: () => {
        const { calls } = get()
        return calls.filter((call) => call.status === 'pending')
      },
    }),
    {
      name: 'waiter-call-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
