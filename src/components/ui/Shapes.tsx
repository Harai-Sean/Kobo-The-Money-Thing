// Decorative geometry: circles, half-circles and triangles that drift slowly. All hidden from
// screen readers. transform-box:fill-box makes each shape rotate around its own centre.
const drift = 'animate-float [transform-box:fill-box] origin-center'

export function HeroShapes({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" aria-hidden="true" className={className}>
      <circle cx="105" cy="75" r="54" className={`fill-sun ${drift}`} />
      <path
        d="M10 170A62 62 0 0 1 134 170Z"
        className={`fill-brand ${drift}`}
        style={{ animationDelay: '-2s' }}
      />
      <path
        d="M118 28L160 112H76Z"
        className={`fill-violet ${drift}`}
        style={{ animationDelay: '-4s' }}
      />
      <circle
        cx="38"
        cy="70"
        r="12"
        className={`fill-leaf ${drift}`}
        style={{ animationDelay: '-1s' }}
      />
    </svg>
  )
}

export function LoginShapes({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 250" aria-hidden="true" className={className}>
      <circle cx="90" cy="110" r="70" className={`fill-sun ${drift}`} />
      <path
        d="M150 250A90 90 0 0 1 330 250Z"
        className={`fill-brand ${drift}`}
        style={{ animationDelay: '-3s' }}
      />
      <path
        d="M200 40L270 160H130Z"
        className={`fill-violet ${drift}`}
        style={{ animationDelay: '-5s' }}
      />
      <circle
        cx="330"
        cy="70"
        r="30"
        className={`fill-leaf ${drift}`}
        style={{ animationDelay: '-1s' }}
      />
      {/* The slider-and-dot motif from the inspiration pictures. */}
      <rect
        x="40"
        y="196"
        width="150"
        height="26"
        rx="13"
        fill="none"
        className="stroke-ink"
        strokeWidth="2.5"
      />
      <circle cx="53" cy="209" r="7" className="fill-ink" />
      <path d="M60 209H150" className="stroke-ink" strokeWidth="2.5" strokeDasharray="2 7" />
    </svg>
  )
}
