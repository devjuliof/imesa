import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ConfigState {
  companySlug: string | null
  tableNumber: string | null
  isConfigured: boolean
  setCompanySlug: (slug: string) => void
  setTableNumber: (tableNumber: string) => void
  setConfig: (slug: string, tableNumber: string) => void
  clearConfig: () => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      companySlug: null,
      tableNumber: null,
      isConfigured: false,
      setCompanySlug: (slug) => set({ companySlug: slug, isConfigured: true }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setConfig: (slug, tableNumber) => set({ companySlug: slug, tableNumber, isConfigured: true }),
      clearConfig: () => set({ companySlug: null, tableNumber: null, isConfigured: false }),
    }),
    {
      name: 'imesa-config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
