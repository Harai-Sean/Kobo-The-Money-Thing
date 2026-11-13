// Small per-device preferences. Storage can be blocked, so every access is wrapped.
const NUDGES_KEY = 'kobo-nudges'

/** Playful spending comments are ON unless the person switched them off. */
export function readNudgesEnabled(): boolean {
  try {
    return localStorage.getItem(NUDGES_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveNudgesEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NUDGES_KEY, enabled ? 'on' : 'off')
  } catch {
    /* the choice still applies until the page is reloaded */
  }
}
