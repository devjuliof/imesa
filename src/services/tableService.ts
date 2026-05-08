import { api } from './api'
import type { ApiResponse } from '../types'

export interface RegisterDevicePayload {
  tableNumber: string
  deviceId: string
}

export interface RegisterDeviceResponse {
  id: string
  number: string
  name: string | null
  status: 'free' | 'occupied'
  deviceId: string | null
}

export const tableService = {
  /**
   * Register this device to a table
   * Creates the table if it doesn't exist, or links the device to existing table
   * POST /public/tables/:companySlug/register-device
   */
  /**
   * Start a new session for this table
   * POST /public/tables/:companySlug/:tableId/session
   */
  startSession: async (
    companySlug: string,
    tableId: string,
  ): Promise<{ sessionId: string; tableId: string; tableNumber: string; status: string }> => {
    const response = await api.post(`/public/tables/${companySlug}/${tableId}/session`, {})
    return response.data.data
  },

  registerDevice: async (
    companySlug: string,
    payload: RegisterDevicePayload
  ): Promise<RegisterDeviceResponse> => {
    const response = await api.post<ApiResponse<RegisterDeviceResponse>>(
      `/public/tables/${companySlug}/register-device`,
      payload
    )
    return response.data.data
  },
}
