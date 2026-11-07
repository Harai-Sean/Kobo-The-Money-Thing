/** A coin: yellow disc, blue half, ink rim. Decorative, so hidden from screen readers. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" className="fill-sun stroke-ink" strokeWidth="2" />
      <path d="M16 1a15 15 0 0 1 0 30z" className="fill-brand" />
    </svg>
  )
}
