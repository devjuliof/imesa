import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CartItem, CartItemAdditional } from '../types'

// Generate a unique key for a cart item based on productId and additionals
const generateCartItemKey = (
  productId: string,
  additionals?: CartItemAdditional[]
): string => {
  const safeAdditionals = additionals || []
  if (safeAdditionals.length === 0) {
    return productId
  }
  const additionalsKey = safeAdditionals
    .map((a) => a.itemId)
    .sort()
    .join('|')
  return `${productId}::${additionalsKey}`
}

interface CartState {
  companySlug: string | null
  tableNumber: string | null
  items: CartItem[]
}

interface CartActions {
  setCompanySlug: (slug: string) => void
  setTableNumber: (tableNumber: string) => void
  addItem: (item: CartItem) => void
  updateQuantity: (itemKey: string, quantity: number) => void
  removeItem: (itemKey: string) => void
  getItemKey: (item: CartItem) => string
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      companySlug: null,
      tableNumber: null,
      items: [],

      setCompanySlug: (slug: string) => {
        const current = get().companySlug
        if (current && current !== slug) {
          // Clear cart when switching companies
          set({
            companySlug: slug,
            items: [],
          })
        } else {
          set({ companySlug: slug })
        }
      },

      setTableNumber: (tableNumber: string) => {
        set({ tableNumber })
      },

      addItem: (item: CartItem) => {
        set((state) => {
          const itemKey = generateCartItemKey(item.productId, item.additionals)
          const existingIndex = state.items.findIndex(
            (i) => generateCartItemKey(i.productId, i.additionals) === itemKey
          )

          if (existingIndex >= 0) {
            // Update existing item (same product with same additionals)
            const newItems = [...state.items]
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
              observations:
                item.observations || newItems[existingIndex].observations,
            }
            return { items: newItems }
          }

          // Add new item (different additionals = different cart item)
          return { items: [...state.items, item] }
        })
      },

      updateQuantity: (itemKey: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemKey)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            generateCartItemKey(item.productId, item.additionals) === itemKey
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      removeItem: (itemKey: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              generateCartItemKey(item.productId, item.additionals) !== itemKey
          ),
        }))
      },

      getItemKey: (item: CartItem) =>
        generateCartItemKey(item.productId, item.additionals),

      clearCart: () => {
        set({ items: [] })
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => {
          const safeAdditionals = item.additionals || []
          const additionalsTotal = safeAdditionals.reduce(
            (acc, add) => acc + add.priceCents * add.quantity,
            0
          )
          const itemTotal = (item.unitPrice + additionalsTotal) * item.quantity
          return sum + itemTotal
        }, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        companySlug: state.companySlug,
        tableNumber: state.tableNumber,
        items: state.items,
      }),
    }
  )
)
