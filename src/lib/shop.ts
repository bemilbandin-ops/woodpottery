export function clampCartQuantity(requested: number, stock: number): number {
  const safeRequested = Number.isFinite(requested) ? Math.floor(requested) : 0
  const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0
  return Math.min(Math.max(0, safeRequested), safeStock)
}

export function formatSek(ore: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ore / 100)
}

export function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '')
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.textContent?.trim() ?? ''
}
