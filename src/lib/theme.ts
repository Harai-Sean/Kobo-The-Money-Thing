export type Theme = 'system' | 'light' | 'dark'

const KEY = 'kobo-theme'
export const THEME_LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }

/** Auto -> Light -> Dark -> Auto. */
export const nextTheme = (theme: Theme): Theme =>
  theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'

// Storage can be blocked (private mode, strict settings), so every access is wrapped.
export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

/** "system" removes the attribute so the device's own light/dark setting decides. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    /* the choice still applies for this visit */
  }
}
