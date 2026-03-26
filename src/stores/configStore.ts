import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Simple UUID v4 generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface ConfigState {
  companySlug: string | null
  tableNumber: string | null
  tableId: string | null
  deviceId: string | null
  isConfigured: boolean
  setCompanySlug: (slug: string) => void
  setTableNumber: (tableNumber: string) => void
  setTableId: (tableId: string | null) => void
  setConfig: (slug: string, tableNumber: string, tableId: string) => void
  getOrCreateDeviceId: () => string
  clearConfig: () => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      companySlug: null,
      tableNumber: null,
      tableId: null,
      deviceId: null,
      isConfigured: false,
      setCompanySlug: (slug) => set({ companySlug: slug, isConfigured: true }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setTableId: (tableId) => set({ tableId }),
      setConfig: (slug, tableNumber, tableId) => set({
        companySlug: slug,
        tableNumber,
        tableId,
        isConfigured: true
      }),
      getOrCreateDeviceId: () => {
        const current = get().deviceId
        if (current) return current
        const newDeviceId = generateUUID()
        set({ deviceId: newDeviceId })
        return newDeviceId
      },
      clearConfig: () => set({
        companySlug: null,
        tableNumber: null,
        tableId: null,
        isConfigured: false
      }),
    }),
    {
      name: 'imesa-config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
