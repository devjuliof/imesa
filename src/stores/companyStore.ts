import { create } from 'zustand'
import type { CatalogCompany } from '../types'

interface CompanyState {
  company: CatalogCompany | null
  setCompany: (company: CatalogCompany) => void
  clearCompany: () => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  setCompany: (company) => set({ company }),
  clearCompany: () => set({ company: null }),
}))
