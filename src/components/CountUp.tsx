import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  // No matchMedia (old browsers, test environments) counts as "reduce": show the number at once.
  return (
    typeof window.matchMedia !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Animates a number from its previous value to the new one, then shows it formatted. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const reduce = prefersReducedMotion()

  useEffect(() => {
    if (reduce) return
    const start = from.current
    const t0 = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - t0) / 600)
      const eased = 1 - (1 - progress) ** 3 // fast start, gentle landing
      const current = Math.round(start + (value - start) * eased)
      from.current = current
      setShown(current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduce])

  return <>{format(reduce ? value : shown)}</>
}
