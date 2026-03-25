import { api } from './api'
import type { ApiResponse, CreateOrderPayload, Order, PixCharge, PixPaymentStatusResponse } from '../types'

export interface WaiterCallPayload {
  companySlug: string
  tableNumber: string
  type: 'call' | 'bill'
}

export const orderService = {
  /**
   * Create a new order
   * POST /public/orders/:companySlug
   */
  createOrder: async (companySlug: string, payload: CreateOrderPayload): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/public/orders/${companySlug}`, payload)
    return response.data.data
  },

  /**
   * Call waiter to the table
   */
  callWaiter: async (payload: WaiterCallPayload): Promise<void> => {
    await api.post('/public/waiter-call', payload)
  },

  /**
   * Create PIX charge for an order
   * Returns QR code URL and brCode (copia e cola)
   */
  createPixCharge: async (orderId: string): Promise<PixCharge> => {
    const response = await api.post<ApiResponse<PixCharge>>(
      '/public/payments/charge',
      { orderId }
    )
    return response.data.data
  },

  /**
   * Get payment status for an order
   * Used for polling to check if payment was completed
   */
  getPaymentStatus: async (orderId: string): Promise<PixPaymentStatusResponse> => {
    const response = await api.get<ApiResponse<PixPaymentStatusResponse>>(
      `/public/payments/${orderId}/status`
    )
    return response.data.data
  },
}
