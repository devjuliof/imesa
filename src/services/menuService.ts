import { api } from './api'
import type {
  CatalogResponse,
  ProductDetailResponse,
  ApiResponse,
} from '../types'

export const menuService = {
  /**
   * Get the full menu catalog for a company.
   *
   * iMesa runs on the restaurant tables, so it must only show products
   * available in the dine-in (salão) channel. Passing the channel lets the
   * backend filter out delivery-only products.
   */
  getPublicMenu: async (
    companySlug: string,
    channel: 'dine_in' | 'delivery' = 'dine_in'
  ): Promise<CatalogResponse> => {
    const response = await api.get<ApiResponse<CatalogResponse>>(
      `/public/menu/${companySlug}`,
      { params: { channel } }
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
