import { api } from './api'
import type {
  ApiResponse,
  CreateOrderPayload,
  Order,
  PixCharge,
  PixPaymentStatusResponse,
  CardFormData,
  CreateCardChargePayload,
  CardChargeResponse,
  PaymentConfig,
  MpCardTokenResponse,
  MpInstallmentResponse,
} from '../types'

const MP_API_URL = 'https://api.mercadopago.com/v1'

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

  // ==================== CARD PAYMENT (Mercado Pago) ====================

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
   * Tokenize card data via Mercado Pago public API
   * This is called on the frontend to avoid sending card data to our backend
   * Uses POST /v1/card_tokens?public_key=...
   */
  tokenizeCard: async (
    publicKey: string,
    cardData: CardFormData,
    cpf: string,
  ): Promise<MpCardTokenResponse> => {
    const response = await fetch(`${MP_API_URL}/card_tokens?public_key=${publicKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_number: cardData.number.replace(/\s/g, ''),
        expiration_month: parseInt(cardData.expMonth, 10),
        expiration_year: parseInt(`20${cardData.expYear}`, 10),
        security_code: cardData.cvv,
        cardholder: {
          name: cardData.holderName.toUpperCase(),
          identification: {
            type: 'CPF',
            number: cpf.replace(/\D/g, ''),
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData?.message || errorData?.cause?.[0]?.description || 'Erro ao processar cartao. Verifique os dados.'
      throw new Error(message)
    }

    return response.json()
  },

  /**
   * Fetch installment options from Mercado Pago API
   * Uses GET /v1/payment_methods/installments?amount=X&bin=XXXXXX&public_key=...
   */
  getInstallments: async (
    publicKey: string,
    amountInReais: number,
    bin: string,
  ): Promise<MpInstallmentResponse[]> => {
    const response = await fetch(
      `${MP_API_URL}/payment_methods/installments?amount=${amountInReais}&bin=${bin}&public_key=${publicKey}`,
    )

    if (!response.ok) {
      return []
    }

    return response.json()
  },

  /**
   * Create a card charge for an order via our backend
   * Uses token from Mercado Pago tokenizeCard
   */
  createCardCharge: async (payload: CreateCardChargePayload): Promise<CardChargeResponse> => {
    const response = await api.post<ApiResponse<CardChargeResponse>>(
      '/public/payments/card-charge',
      payload
    )
    return response.data.data
  },
}
