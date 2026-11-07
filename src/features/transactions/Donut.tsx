import type { CategoryShare } from './summary'

/**
 * A donut chart drawn as SVG circles. Each slice is a circle whose stroke is only partly drawn.
 * pathLength="100" makes the circle's length 100 units, so a slice's length is simply its
 * percentage. The chart and its centre label are decoration: the legend beside it says the
 * same in text, so both are hidden from screen readers.
 */
export function Donut({ slices }: { slices: readonly CategoryShare[] }) {
  const sum = slices.reduce((total, s) => total + s.total, 0)
  const top = slices[0]
  if (sum === 0 || !top) return null
  // Each slice starts where the previous one ended (a running total, computed up front).
  const lengths = slices.map((s) => (s.total / sum) * 100)
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <div aria-hidden="true" className="relative size-56 shrink-0">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        <circle cx="100" cy="100" r="70" fill="none" strokeWidth="30" className="stroke-track" />
        {slices.map((slice, i) => {
          const drawn = Math.max((lengths[i] ?? 0) - 0.8, 0) // a hairline gap between slices
          return (
            <circle
              key={slice.categoryId ?? 'none'}
              cx="100"
              cy="100"
              r="70"
              pathLength="100"
              fill="none"
              stroke={slice.color}
              strokeWidth="30"
              strokeDasharray={`${drawn} ${100 - drawn}`}
              strokeDashoffset={-(starts[i] ?? 0)}
              className="animate-sweep"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-4xl font-extrabold tracking-tight">{top.percent}%</p>
          <p className="max-w-24 text-xs font-semibold text-muted">{top.name}</p>
        </div>
      </div>
    </div>
  )
}
