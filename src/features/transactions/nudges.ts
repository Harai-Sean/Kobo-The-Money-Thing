import type { MonthKey } from '../../lib/dates/dates'
import type { MonthTotals } from './summary'

export interface Nudge {
  text: string
  emoji: string
}

type Variant = (percent: number) => Nudge

/**
 * Cheeky comments, ONLY for spending that is a choice. Rent, food shopping, health, family,
 * education and utilities are never joked about. The wording is playful and never shames.
 */
const GROUPS: Record<string, { up: Variant[]; big: Variant[] }> = {
  'Eating out': {
    up: [
      () => ({ text: 'You need to eat out less yo', emoji: '😭' }),
      (p) => ({ text: `Eating out is up ${p}%. Your kitchen misses you`, emoji: '🍳' }),
      (p) => ({ text: `Eating out is looking questionable this month (+${p}%)`, emoji: '👀' }),
    ],
    big: [(p) => ({ text: `${p}% of your spending is eating out. Hmm`, emoji: '🤨' })],
  },
  Shopping: {
    up: [
      (p) => ({ text: `Shopping is up ${p}%. The cart is working overtime`, emoji: '🛒' }),
      () => ({ text: 'Your wallet just asked if you really need it', emoji: '🛍️' }),
    ],
    big: [
      (p) => ({
        text: `${p}% of your spending is shopping. Questionable, but we love the energy`,
        emoji: '😅',
      }),
    ],
  },
  Entertainment: {
    up: [
      (p) => ({ text: `Fun is up ${p}%. Enjoy, but your wallet wants a word`, emoji: '🎬' }),
      () => ({ text: 'Entertainment is climbing. Maybe one free hangout this week?', emoji: '🎮' }),
    ],
    big: [
      (p) => ({ text: `${p}% on entertainment. Living your best life, expensively`, emoji: '🎉' }),
    ],
  },
  Transport: {
    up: [
      (p) => ({ text: `Rides are up ${p}%. Those short trips add up`, emoji: '🚕' }),
      () => ({ text: 'Transport is climbing. Walk the short ones?', emoji: '🚶' }),
    ],
    big: [(p) => ({ text: `${p}% of your spending is transport. Moving a lot!`, emoji: '🛣️' })],
  },
  'Airtime and data': {
    up: [
      (p) => ({ text: `Data is up ${p}%. It disappears fast, abi?`, emoji: '📶' }),
      () => ({ text: 'Airtime and data are climbing. Wi-Fi is your friend', emoji: '📱' }),
    ],
    big: [(p) => ({ text: `${p}% on airtime and data. That is a lot of scrolling`, emoji: '📶' })],
  },
  'Fees and charges': {
    up: [
      (p) => ({ text: `Fees are up ${p}%. Sneaky little charges. Worth a look`, emoji: '🕵️' }),
      () => ({ text: 'Bank charges are adding up. Maybe fewer small transfers?', emoji: '🏦' }),
    ],
    big: [(p) => ({ text: `${p}% of your spending is fees. Something is leaking`, emoji: '🕳️' })],
  },
}

const MIN_SPEND = 300_000 // ₦3,000: below this, nothing is worth a comment
const UP_RATIO = 1.3 // up at least 30% on last month
const BIG_SHARE = 40 // or at least 40% of everything spent...
const BIG_MIN_TOTAL = 1_000_000 // ...but only once the month's total is at least ₦10,000

// The same month and category always pick the same wording, so it never flickers on re-render.
function pick(variants: Variant[], percent: number, month: MonthKey, name: string): Nudge {
  const seed = [...`${month}:${name}`].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const variant = variants[seed % variants.length]
  return variant ? variant(percent) : { text: '', emoji: '' }
}

/** At most one comment: the biggest category jump, else a bit of praise, else nothing. */
export function pickNudge(
  current: MonthTotals,
  previous: MonthTotals | null,
  month: MonthKey,
): Nudge | null {
  let best: { score: number; nudge: Nudge } | null = null

  for (const category of current.categories) {
    const group = GROUPS[category.name]
    if (!group || category.total < MIN_SPEND) continue
    const before =
      previous?.categories.find((c) => c.categoryId === category.categoryId)?.total ?? 0

    let candidate: { score: number; nudge: Nudge } | null = null
    if (before > 0 && category.total >= before * UP_RATIO) {
      const percent = Math.round(((category.total - before) / before) * 100)
      candidate = {
        score: category.total - before,
        nudge: pick(group.up, percent, month, category.name),
      }
    } else if (category.percent >= BIG_SHARE && current.expense >= BIG_MIN_TOTAL) {
      candidate = {
        score: category.total,
        nudge: pick(group.big, category.percent, month, category.name),
      }
    }
    if (candidate && (!best || candidate.score > best.score)) best = candidate
  }
  if (best) return best.nudge

  if (
    previous &&
    previous.expense > 0 &&
    current.expense > 0 &&
    current.expense <= previous.expense * 0.85
  ) {
    const percent = Math.round(((previous.expense - current.expense) / previous.expense) * 100)
    return { text: `Spending is down ${percent}% on last month. Look at you`, emoji: '👏' }
  }
  return null
}
