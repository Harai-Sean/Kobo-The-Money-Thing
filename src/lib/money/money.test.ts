import { describe, expect, it } from 'vitest'
import { formatNaira, MAX_KOBO, nairaToKobo, sharePercentages } from './money'

describe('nairaToKobo', () => {
  it.each([
    ['1500', 150_000],
    ['1,500', 150_000],
    ['1,500.5', 150_050],
    ['1500.50', 150_050],
    ['0.07', 7],
    ['0.5', 50],
    ['  250 ', 25_000],
    ['1,000,000', 100_000_000],
  ])('reads %s as %i kobo', (text, kobo) => {
    expect(nairaToKobo(text)).toBe(kobo)
  })

  it.each([
    [''],
    ['abc'],
    ['-5'],
    ['1e5'],
    ['1500.555'], // sub-kobo amounts are refused, never silently rounded
    ['15,00'], // misplaced comma is ambiguous
    ['1,,500'],
    ['0'],
    ['0.00'],
    ['1500.'],
    ['.5'],
    ['999999999999999999'],
  ])('rejects %j', (text) => {
    expect(nairaToKobo(text)).toBeNull()
  })

  it('accepts exactly the maximum and rejects one kobo above it', () => {
    expect(nairaToKobo('1,000,000,000')).toBe(MAX_KOBO)
    expect(nairaToKobo('1,000,000,000.01')).toBeNull()
  })

  it('has no floating-point drift', () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004; in kobo it is exact.
    expect((nairaToKobo('0.10') ?? 0) + (nairaToKobo('0.20') ?? 0)).toBe(30)
  })
})

describe('formatNaira', () => {
  it.each([
    [150_000, '₦1,500'],
    [150_050, '₦1,500.50'],
    [7, '₦0.07'],
    [100_000_000, '₦1,000,000'],
    [-50_000, '-₦500'],
    [0, '₦0'],
  ])('formats %i kobo as %s', (kobo, expected) => {
    expect(formatNaira(kobo)).toBe(expected)
  })
})

describe('sharePercentages', () => {
  it('always adds up to exactly 100', () => {
    expect(sharePercentages([1, 1, 1])).toEqual([34, 33, 33])
    expect(sharePercentages([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('handles realistic spending', () => {
    const result = sharePercentages([450_000, 300_000, 150_000, 100_000])
    expect(result).toEqual([45, 30, 15, 10])
  })

  it('keeps a tiny category visible without breaking the total', () => {
    const result = sharePercentages([999_999, 1])
    expect(result.reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('returns zeros for an empty or all-zero month', () => {
    expect(sharePercentages([])).toEqual([])
    expect(sharePercentages([0, 0])).toEqual([0, 0])
  })
})
