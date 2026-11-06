# Status

_Update this file at the end of every work session. Paste it into a new chat to resume quickly._

## Done

- Visual identity: deep-green and lime palette, Bricolage Grotesque and Instrument Sans (self-hosted),
  ledger-style list, donut chart, motion that respects reduced-motion
- CSV export from Settings (formula-safe), paging API for large data
- Keep-alive workflow and `ping()` migration (needs repo secrets; see README)

- Project scaffold: Vite, React, TypeScript strict, Tailwind v4, Router, TanStack Query, Zod
- Environment validation (`src/lib/env.ts`) with tests
- CI workflow, Dependabot, PR template
- Database migration `0001` (schema, RLS, signup trigger) and RLS check script
- Auth: login, route guard (`RequireAuth`), sign out, change password, cache wipe on sign-out
- Money utilities (`src/lib/money`): integer kobo, `nairaToKobo`, `formatNaira`, `sharePercentages`
- Date utilities (`src/lib/dates`): ISO date strings, `todayIso`, `addDays`, weekdays, month helpers
- Quick-add parser (`src/lib/parser`): amounts (k/m, commas, ₦), dates, income, categories, warnings
- Transactions: data layer (TanStack Query, optimistic add/delete/undo), QuickAdd with live preview
  and category correction that saves rules, grouped list, month switcher, month summary

## Next

1. Edit entries, search and filter
2. Dark theme, PWA install, offline (see ADR-001)
3. Wire parser `history`; budgets

## Decisions

- ADR-001: Supabase directly, no offline in v0.1 (docs/adr)
- Naira only, light theme first, invite-only accounts, no "reset month" (months are views)
- Auth code depends on a small `AuthApi` interface, not on Supabase directly, so tests use a fake
- Known: production bundle is over 500 kB; revisit with code-splitting when charts arrive
- Parser `history` input exists but is not wired yet; saved rules cover learning for now
- The Supabase data layer (`api.ts`) is only verified against a fake; first live run is the real test
