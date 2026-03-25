import { api } from './api'
import type {
  CatalogResponse,
  ProductDetailResponse,
  ApiResponse,
} from '../types'

export const menuService = {
  /**
   * Get the full menu catalog for a company
   */
  getPublicMenu: async (companySlug: string): Promise<CatalogResponse> => {
    const response = await api.get<ApiResponse<CatalogResponse>>(
      `/public/menu/${companySlug}`
    )
    return response.data.data
  },

  /**
   * Get detailed product information including addons
   */
  getPublicProduct: async (
    companySlug: string,
    productId: string
  ): Promise<ProductDetailResponse> => {
    const response = await api.get<ApiResponse<ProductDetailResponse>>(
      `/public/menu/${companySlug}/products/${productId}`
    )
    return response.data.data
  },
}
