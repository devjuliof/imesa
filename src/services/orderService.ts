import { api } from './api'
import type {
  ApiResponse,
  CreateOrderPayload,
  Order,
  PixCharge,
  PixPaymentStatusResponse,
  CardCharge,
  CardFormData,
  CreateCardChargePayload,
  PaymentConfig,
} from '../types'

const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

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

  // ==================== CARD PAYMENT ====================

  /**
   * Get payment configuration for a company
   * Returns public key and enabled payment methods
   */
  getPaymentConfig: async (companySlug: string): Promise<PaymentConfig> => {
    const response = await api.get<ApiResponse<PaymentConfig>>(
      `/public/payments/config/${companySlug}`
    )
    return response.data.data
  },

  /**
   * Tokenize card data directly with Pagar.me
   * This is called on the frontend to avoid sending card data to our backend
   * Token expires in 60 seconds
   */
  tokenizeCard: async (publicKey: string, cardData: CardFormData): Promise<string> => {
    const response = await fetch(`${PAGARME_API_URL}/tokens?appId=${publicKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holderName.toUpperCase(),
          exp_month: parseInt(cardData.expMonth, 10),
          exp_year: parseInt(cardData.expYear, 10),
          cvv: cardData.cvv,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erro ao processar cartao')
    }

    const data = await response.json()
    return data.id
  },

  /**
   * Create a card charge for an order
   * Uses token from tokenizeCard
   */
  createCardCharge: async (payload: CreateCardChargePayload): Promise<CardCharge> => {
    const response = await api.post<ApiResponse<CardCharge>>(
      '/public/payments/card-charge',
      payload
    )
    return response.data.data
  },
}
