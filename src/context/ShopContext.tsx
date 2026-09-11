import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createDemoCheckoutAdapter } from '../adapters/checkout'
import { localShopRepository, type ShopRepository } from '../adapters/repository'
import { clampCartQuantity } from '../lib/shop'
import type { CartItem, CheckoutCustomer, CheckoutResult, ShopSnapshot } from '../types'

const CART_KEY = 'woodpottery.cart.v1'
const checkoutAdapter = createDemoCheckoutAdapter(localShopRepository)

interface ShopContextValue {
  snapshot: ShopSnapshot
  cart: CartItem[]
  cartCount: number
  repository: ShopRepository
  text: (key: string, fallback?: string) => string
  refresh: () => void
  addToCart: (productId: string) => void
  setCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  submitCheckout: (customer: CheckoutCustomer) => Promise<CheckoutResult>
}

const ShopContext = createContext<ShopContextValue | null>(null)

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) ?? '[]') as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => localShopRepository.snapshot())
  const [cart, setCart] = useState<CartItem[]>(readCart)

  const refresh = useCallback(() => setSnapshot(localShopRepository.snapshot()), [])

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    setCart((current) =>
      current.flatMap((item) => {
        const product = snapshot.products.find((candidate) => candidate.id === item.productId && candidate.visible)
        if (!product) return []
        const quantity = clampCartQuantity(item.quantity, product.stock)
        return quantity > 0 ? [{ ...item, quantity }] : []
      }),
    )
  }, [snapshot])

  const addToCart = useCallback(
    (productId: string) => {
      const product = snapshot.products.find((candidate) => candidate.id === productId && candidate.visible)
      if (!product || product.stock < 1) return
      setCart((current) => {
        const existing = current.find((item) => item.productId === productId)
        const nextQuantity = clampCartQuantity((existing?.quantity ?? 0) + 1, product.stock)
        if (existing) return current.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
        return [...current, { productId, quantity: nextQuantity }]
      })
    },
    [snapshot.products],
  )

  const setCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = snapshot.products.find((candidate) => candidate.id === productId)
      if (!product) return
      const nextQuantity = clampCartQuantity(quantity, product.stock)
      setCart((current) =>
        nextQuantity === 0
          ? current.filter((item) => item.productId !== productId)
          : current.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item)),
      )
    },
    [snapshot.products],
  )

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const submitCheckout = useCallback(
    async (customer: CheckoutCustomer) => {
      const result = await checkoutAdapter.submit({ items: cart, customer })
      clearCart()
      refresh()
      return result
    },
    [cart, clearCart, refresh],
  )

  const text = useCallback(
    (key: string, fallback = '') => snapshot.content.find((entry) => entry.key === key)?.html ?? fallback,
    [snapshot.content],
  )

  const value = useMemo<ShopContextValue>(
    () => ({
      snapshot,
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      repository: localShopRepository,
      text,
      refresh,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      submitCheckout,
    }),
    [snapshot, cart, text, refresh, addToCart, setCartQuantity, removeFromCart, clearCart, submitCheckout],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop måste användas inuti ShopProvider.')
  return context
}
