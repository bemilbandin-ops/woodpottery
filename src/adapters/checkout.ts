import { clampCartQuantity } from '../lib/shop'
import type { CheckoutRequest, CheckoutResult, Order, OrderLine } from '../types'
import type { ShopRepository } from './repository'

export interface CheckoutAdapter {
  submit(request: CheckoutRequest): Promise<CheckoutResult>
}

function createOrderId(): string {
  return `RF-${Date.now().toString(36).toUpperCase()}`
}

export function createDemoCheckoutAdapter(repository: ShopRepository): CheckoutAdapter {
  return {
    async submit(request) {
      const snapshot = repository.snapshot()
      if (!request.items.length) throw new Error('Varukorgen är tom.')

      const lines: OrderLine[] = []
      const nextStock: Record<string, number> = {}

      for (const item of request.items) {
        const product = snapshot.products.find((candidate) => candidate.id === item.productId && candidate.visible)
        if (!product) throw new Error('Ett objekt finns inte längre.')

        const quantity = clampCartQuantity(item.quantity, product.stock)
        if (quantity !== item.quantity || quantity < 1) {
          throw new Error(`${product.title} har ändrat lager.`)
        }

        lines.push({
          productId: product.id,
          title: product.title,
          quantity,
          unitPriceOre: product.priceOre,
        })
        nextStock[product.id] = product.stock - quantity
      }

      const subtotalOre = lines.reduce((sum, line) => sum + line.unitPriceOre * line.quantity, 0)
      const shippingOre = subtotalOre >= snapshot.settings.freeShippingThresholdOre ? 0 : snapshot.settings.shippingOre
      const order: Order = {
        id: createOrderId(),
        createdAt: new Date().toISOString(),
        status: 'demo',
        customer: request.customer,
        lines,
        subtotalOre,
        shippingOre,
        totalOre: subtotalOre + shippingOre,
      }

      repository.commitOrder(order, nextStock)
      return { order }
    },
  }
}
