export type ProductCategory = 'trä' | 'keramik'
export type PublicPage = 'home' | 'footer' | 'terms' | 'privacy'
export type TextAlignment = 'left' | 'center' | 'right'
export type TextSize = 'small' | 'normal' | 'large' | 'display'

export interface Product {
  id: string
  slug: string
  title: string
  category: ProductCategory
  priceOre: number
  stock: number
  visible: boolean
  featured: boolean
  descriptionHtml: string
  detailsHtml: string
  image: string
  imageAlt: string
  sortOrder: number
}

export interface ContentEntry {
  id: string
  key: string
  label: string
  page: PublicPage
  html: string
  sortOrder: number
}

export interface CustomBlock {
  id: string
  page: PublicPage
  html: string
  alignment: TextAlignment
  size: TextSize
  visible: boolean
  sortOrder: number
}

export interface ShopSettings {
  brandName: string
  contactEmail: string
  instagramUrl: string
  shippingOre: number
  freeShippingThresholdOre: number
}

export interface CartItem {
  productId: string
  quantity: number
}

export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
}

export interface OrderLine {
  productId: string
  title: string
  quantity: number
  unitPriceOre: number
}

export interface Order {
  id: string
  createdAt: string
  status: 'demo'
  customer: CheckoutCustomer
  lines: OrderLine[]
  subtotalOre: number
  shippingOre: number
  totalOre: number
}

export interface ShopSnapshot {
  version: 1
  products: Product[]
  content: ContentEntry[]
  customBlocks: CustomBlock[]
  settings: ShopSettings
  orders: Order[]
}

export interface CheckoutRequest {
  items: CartItem[]
  customer: CheckoutCustomer
}

export interface CheckoutResult {
  order: Order
}

export interface AuthSession {
  user: string
  issuedAt: string
}
