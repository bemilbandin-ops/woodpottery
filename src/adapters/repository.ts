import { seedSnapshot } from '../data/seed'
import type { ContentEntry, CustomBlock, Order, Product, ShopSettings, ShopSnapshot } from '../types'

const STORAGE_KEY = 'woodpottery.shop.v1'

export interface ShopRepository {
  snapshot(): ShopSnapshot
  upsertProduct(product: Product): ShopSnapshot
  deleteProduct(id: string): ShopSnapshot
  upsertContent(entry: ContentEntry): ShopSnapshot
  deleteContent(id: string): ShopSnapshot
  upsertCustomBlock(block: CustomBlock): ShopSnapshot
  deleteCustomBlock(id: string): ShopSnapshot
  updateSettings(settings: ShopSettings): ShopSnapshot
  commitOrder(order: Order, nextStock: Record<string, number>): ShopSnapshot
  reset(): ShopSnapshot
}

function cloneSeed(): ShopSnapshot {
  return JSON.parse(JSON.stringify(seedSnapshot)) as ShopSnapshot
}

function load(): ShopSnapshot {
  if (typeof window === 'undefined') return cloneSeed()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return cloneSeed()
  try {
    const parsed = JSON.parse(raw) as ShopSnapshot
    if (parsed.version !== 1 || !Array.isArray(parsed.products) || !Array.isArray(parsed.content)) return cloneSeed()
    return parsed
  } catch {
    return cloneSeed()
  }
}

function save(snapshot: ShopSnapshot): ShopSnapshot {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  return snapshot
}

function update(mutator: (draft: ShopSnapshot) => void): ShopSnapshot {
  const draft = load()
  mutator(draft)
  return save(draft)
}

export const localShopRepository: ShopRepository = {
  snapshot: load,
  upsertProduct(product) {
    return update((draft) => {
      const index = draft.products.findIndex((item) => item.id === product.id)
      if (index >= 0) draft.products[index] = product
      else draft.products.push(product)
    })
  },
  deleteProduct(id) {
    return update((draft) => {
      draft.products = draft.products.filter((item) => item.id !== id)
    })
  },
  upsertContent(entry) {
    return update((draft) => {
      const index = draft.content.findIndex((item) => item.id === entry.id)
      if (index >= 0) draft.content[index] = entry
      else draft.content.push(entry)
    })
  },
  deleteContent(id) {
    return update((draft) => {
      draft.content = draft.content.filter((item) => item.id !== id)
    })
  },
  upsertCustomBlock(block) {
    return update((draft) => {
      const index = draft.customBlocks.findIndex((item) => item.id === block.id)
      if (index >= 0) draft.customBlocks[index] = block
      else draft.customBlocks.push(block)
    })
  },
  deleteCustomBlock(id) {
    return update((draft) => {
      draft.customBlocks = draft.customBlocks.filter((item) => item.id !== id)
    })
  },
  updateSettings(settings) {
    return update((draft) => {
      draft.settings = settings
    })
  },
  commitOrder(order, nextStock) {
    return update((draft) => {
      draft.products = draft.products.map((product) =>
        Object.prototype.hasOwnProperty.call(nextStock, product.id)
          ? { ...product, stock: Math.max(0, nextStock[product.id]) }
          : product,
      )
      draft.orders.unshift(order)
    })
  },
  reset() {
    return save(cloneSeed())
  },
}
