/**
 * Money in Kobo: every amount is a whole number of kobo (₦1 = 100 kobo), stored and calculated
 * as integers. Decimals are only ever used to DISPLAY. This avoids the classic bug where
 * 0.1 + 0.2 = 0.30000000000000004.
 */

/** Largest amount we accept: ₦1 billion. Matches the CHECK constraint in the database. */
export const MAX_KOBO = 100_000_000_000

// "1500", "1,500", "1,500.5", "0.07". Commas only as proper thousands separators.
const AMOUNT_PATTERN = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/

/**
 * Turns text like "1,500.50" into kobo (150050). Returns null if the text is not a valid
 * transaction amount: not a number, more than 2 decimals, zero, or above the maximum.
 * Works on the digits as text, so no floating-point maths is involved.
 */
export function nairaToKobo(text: string): number | null {
  const match = AMOUNT_PATTERN.exec(text.trim())
  if (!match) return null
  const [whole = '', fraction = ''] = text.trim().replaceAll(',', '').split('.')
  if (whole.length > 12) return null // far above the maximum; avoids huge-number surprises
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return kobo > 0 && kobo <= MAX_KOBO ? kobo : null
}

const nairaFormat = (digits: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  })
const whole = nairaFormat(0)
const withKobo = nairaFormat(2)

/** "₦1,500" for whole naira, "₦1,500.50" only when there are kobo. Negative: "-₦500". */
export function formatNaira(kobo: number): string {
  return (kobo % 100 === 0 ? whole : withKobo).format(kobo / 100)
}

/**
 * Splits values into whole-number percentages that ALWAYS add up to exactly 100
 * (largest-remainder method). Plain rounding can give 33 + 33 + 33 = 99 on a chart label.
 * Returns zeros when the total is zero.
 */
export function sharePercentages(values: readonly number[]): number[] {
  const safe = values.map((v) => Math.max(0, v))
  const total = safe.reduce((sum, v) => sum + v, 0)
  if (total === 0) return safe.map(() => 0)

  const exact = safe.map((v) => (v * 100) / total)
  const result = exact.map((x) => Math.floor(x))
  let remaining = 100 - result.reduce((sum, v) => sum + v, 0)

  // Hand the leftover points to the items with the biggest fractional parts (earlier wins ties).
  const byRemainder = exact
    .map((x, index) => ({ index, fraction: x - Math.floor(x) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of byRemainder) {
    if (remaining <= 0) break
    result[index] = (result[index] ?? 0) + 1
    remaining -= 1
  }
  return result
}
