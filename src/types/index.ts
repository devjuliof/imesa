// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
}

// ==================== COMPANY ====================

export type ProductLayout = 'vertical' | 'horizontal'

export interface CatalogCompany {
  id: string
  name: string
  slug: string
  logo: string | null
  bannerUrl: string | null
  baseColor: string | null
  productLayout: ProductLayout
  whatsappNumber: string | null
  isOpen: boolean
}

// ==================== MENU ====================

export interface PublicProduct {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  sortOrder: number
}

export interface PublicCategory {
  id: string
  name: string
  icon: string | null
  sortOrder: number
  products: PublicProduct[]
}

export interface CatalogResponse {
  categories: PublicCategory[]
  company: CatalogCompany
}

// ==================== PRODUCT DETAIL ====================

export interface PublicAddonItem {
  id: string
  name: string
  priceCents: number
}

export interface PublicAddonGroup {
  id: string
  name: string
  description: string | null
  minSelections: number
  maxSelections: number
  isRequired: boolean
  items: PublicAddonItem[]
}

// ==================== SUGGESTIONS ====================

export interface PublicProductSuggestion {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  hasRequiredAddons: boolean
}

export interface ProductDetailResponse {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryName: string
  addonGroups: PublicAddonGroup[]
  suggestions: PublicProductSuggestion[]
}

// ==================== CART ====================

export interface CartItemAdditional {
  itemId: string
  name: string
  priceCents: number
  quantity: number
}

export interface CartItem {
  productId: string
  productName: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  observations: string
  additionals: CartItemAdditional[]
}

// ==================== ORDER ====================

export type OrderSource = 'menu' | 'totem' | 'tablet'
export type DeliveryType = 'delivery' | 'pickup' | 'dine_in'
export type PaymentMethod = 'pix' | 'debit' | 'credit' | 'cash' | 'voucher'

export interface OrderItemAdditional {
  id: string
  name: string
  quantity: number
  priceCents: number
}

export interface CreateOrderItem {
  productId: string
  quantity: number
  notes?: string
  additionals?: OrderItemAdditional[]
}

export interface CreateOrderPayload {
  source: OrderSource
  deliveryType?: DeliveryType
  tableNumber?: string
  tableId?: string
  customerName: string
  customerPhone: string
  items: CreateOrderItem[]
  paymentMethod: PaymentMethod
  customerNote?: string
}

export interface Order {
  id: string
  orderNumber: number
  status: string
  totalCents: number
  createdAt: string
}

// ==================== ADDON SELECTION ====================

export interface AddonSelection {
  groupId: string
  groupName: string
  items: {
    itemId: string
    name: string
    priceCents: number
    quantity: number
  }[]
}

// ==================== PAYMENT ====================

export type PixPaymentStatus = 'pending' | 'completed' | 'expired' | 'error'

export interface PixCharge {
  id: string
  orderId: string
  valueCents: number
  status: PixPaymentStatus
  brCode: string
  qrCodeUrl: string
  paymentLinkUrl: string
  expiresAt: string
  createdAt: string
}

export interface PixPaymentStatusResponse {
  orderId: string
  status: PixPaymentStatus
  paidAt: string | null
}

// ==================== CARD PAYMENT ====================

export type CardPaymentType = 'credit_card' | 'debit_card'
export type CardPaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled'

export interface CardCharge {
  id: string
  orderId: string
  valueCents: number
  status: CardPaymentStatus
  paymentType: CardPaymentType
  cardBrand: string | null
  cardLastDigits: string | null
  installments: number
  createdAt: string
}

export interface CardFormData {
  number: string
  holderName: string
  expMonth: string
  expYear: string
  cvv: string
}

export interface CreateCardChargePayload {
  orderId: string
  cardToken: string
  paymentType: CardPaymentType
  installments?: number
}

export interface PaymentConfig {
  pagarmePublicKey: string
  pixEnabled: boolean
  cardEnabled: boolean
  creditInstallmentsMax: number
  creditMinInstallmentCents: number
}

// ==================== NAVIGATION ====================

export type ScreenName =
  | 'Setup'
  | 'Menu'
  | 'ProductDetail'
  | 'CurrentOrder'
  | 'OrderConfirmation'
  | 'Checkout'
  | 'WaiterMode'
