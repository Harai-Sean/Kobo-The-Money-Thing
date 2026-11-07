import { describe, expect, it } from 'vitest'
import { categoryColor, PALETTE, UNCATEGORISED_COLOR } from './colors'

const categories = Array.from({ length: 13 }, (_, i) => ({ id: `c${i}` }))

describe('categoryColor', () => {
  it('gives the first categories different colours', () => {
    const colours = categories.slice(0, PALETTE.length).map((c) => categoryColor(categories, c.id))
    expect(new Set(colours).size).toBe(PALETTE.length)
  })

  it('always gives the same category the same colour', () => {
    expect(categoryColor(categories, 'c3')).toBe(categoryColor([...categories], 'c3'))
  })

  it('wraps around when there are more categories than colours', () => {
    expect(categoryColor(categories, 'c8')).toBe(categoryColor(categories, 'c0'))
  })

  it('uses grey for uncategorised and unknown categories', () => {
    expect(categoryColor(categories, null)).toBe(UNCATEGORISED_COLOR)
    expect(categoryColor(categories, 'gone')).toBe(UNCATEGORISED_COLOR)
  })
})
