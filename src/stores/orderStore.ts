import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CartItem } from '../types'

export interface SentOrder {
  id: string // This is the real orderId from the API
  items: CartItem[]
  totalCents: number
  sentAt: string
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
}

export interface AddSentOrderInput {
  id: string // Real orderId from API
  items: CartItem[]
  totalCents: number
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
}

interface OrderState {
  sentOrders: SentOrder[]
  tableNumber: string | null
  customerName: string | null
  customerPhone: string | null
}

interface OrderActions {
  addSentOrder: (order: AddSentOrderInput) => void
  updateOrderStatus: (orderId: string, status: SentOrder['status']) => void
  clearAllOrders: () => void
  getComandaTotal: () => number
  getAllItems: () => CartItem[]
  getOrderIds: () => string[]
  setTableNumber: (tableNumber: string) => void
  setCustomerInfo: (name: string, phone: string) => void
}

type OrderStore = OrderState & OrderActions

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      sentOrders: [],
      tableNumber: null,
      customerName: null,
      customerPhone: null,

      addSentOrder: (order: AddSentOrderInput) => {
        const newOrder: SentOrder = {
          ...order,
          sentAt: new Date().toISOString(),
        }
        set((state) => ({
          sentOrders: [...state.sentOrders, newOrder],
        }))
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          sentOrders: state.sentOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
        }))
      },

      clearAllOrders: () => {
        set({ sentOrders: [], tableNumber: null, customerName: null, customerPhone: null })
      },

      getComandaTotal: () => {
        const { sentOrders } = get()
        return sentOrders.reduce((total, order) => total + order.totalCents, 0)
      },

      getAllItems: () => {
        const { sentOrders } = get()
        return sentOrders.flatMap((order) => order.items)
      },

      getOrderIds: () => {
        const { sentOrders } = get()
        return sentOrders.map((order) => order.id)
      },

      setTableNumber: (tableNumber) => {
        set({ tableNumber })
      },

      setCustomerInfo: (name, phone) => {
        set({ customerName: name, customerPhone: phone })
      },
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
