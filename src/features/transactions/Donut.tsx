import type { CategoryShare } from './summary'

/**
 * A donut chart drawn as SVG circles. Each slice is a circle whose stroke is only partly drawn.
 * pathLength="100" makes the circle's length 100 units, so a slice's length is simply its
 * percentage. The chart is decoration: the legend beside it says the same in text.
 */
export function Donut({ slices }: { slices: readonly CategoryShare[] }) {
  const sum = slices.reduce((total, s) => total + s.total, 0)
  if (sum === 0) return null
  // Each slice starts where the previous one ended (a running total, computed up front).
  const lengths = slices.map((s) => (s.total / sum) * 100)
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="size-40 shrink-0 -rotate-90">
      {slices.map((slice, i) => {
        const drawn = Math.max((lengths[i] ?? 0) - 0.8, 0) // a hairline gap between slices
        return (
          <circle
            key={slice.categoryId ?? 'none'}
            cx="60"
            cy="60"
            r="44"
            pathLength="100"
            fill="none"
            stroke={slice.color}
            strokeWidth="16"
            strokeDasharray={`${drawn} ${100 - drawn}`}
            strokeDashoffset={-(starts[i] ?? 0)}
            className="animate-sweep"
          />
        )
      })}
    </svg>
  )
}
