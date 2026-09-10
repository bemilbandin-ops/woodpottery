import { describe, expect, it } from 'vitest'
import { clampCartQuantity, formatSek } from './shop'

describe('clampCartQuantity', () => {
  it('never allows a negative quantity', () => {
    expect(clampCartQuantity(-2, 4)).toBe(0)
  })

  it('never allows more than current stock', () => {
    expect(clampCartQuantity(5, 2)).toBe(2)
  })

  it('keeps a valid requested quantity unchanged', () => {
    expect(clampCartQuantity(2, 4)).toBe(2)
  })
})

describe('formatSek', () => {
  it('formats öre as Swedish kronor without decimals for whole kronor', () => {
    expect(formatSek(12500)).toMatch(/125\s?kr/)
  })
})
