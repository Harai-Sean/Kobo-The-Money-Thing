/** A coin: lime disc, deep ring. Decorative, so hidden from screen readers. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" className="fill-lime" />
      <circle cx="16" cy="16" r="9" fill="none" strokeWidth="3.5" className="stroke-deep" />
      <circle cx="16" cy="16" r="2.5" className="fill-deep" />
    </svg>
  )
}
