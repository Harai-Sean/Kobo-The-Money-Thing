import { useState } from 'react'
import { applyTheme, nextTheme, readTheme, THEME_LABEL } from '../lib/theme'

/** One button that cycles Auto, Light, Dark. Auto follows the device. */
export function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme)
  const upcoming = nextTheme(theme)
  return (
    <button
      type="button"
      aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[upcoming]}.`}
      onClick={() => {
        applyTheme(upcoming)
        setTheme(upcoming)
      }}
      className="rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold hover:bg-tint-violet"
    >
      {THEME_LABEL[theme]}
    </button>
  )
}
