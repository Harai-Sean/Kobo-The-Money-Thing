# Status

_Update this file at the end of every work session. Paste it into a new chat to resume quickly._

## Done

- Project scaffold: Vite, React, TypeScript strict, Tailwind v4, Router, TanStack Query, Zod
- Environment validation (`src/lib/env.ts`) with tests
- CI workflow, Dependabot, PR template
- Database migration `0001` (schema, RLS, signup trigger) and RLS check script
- Auth: login, route guard (`RequireAuth`), sign out, change password, cache wipe on sign-out
- Money utilities (`src/lib/money`): integer kobo, `nairaToKobo`, `formatNaira`, `sharePercentages`
- Date utilities (`src/lib/dates`): ISO date strings, `todayIso`, `addDays`, weekdays, month helpers

## Next

1. Apply the migration in Supabase, create two test users, run `supabase/tests/rls_check.sql`
2. Quick-add parser (`src/lib/parser`) using the money and date utilities
3. Transactions data layer (TanStack Query + Zod) and the quick-add UI

## Decisions

- ADR-001: Supabase directly, no offline in v0.1 (docs/adr)
- Naira only, light theme first, invite-only accounts, no "reset month" (months are views)
- Auth code depends on a small `AuthApi` interface, not on Supabase directly, so tests use a fake
- Known: production bundle is over 500 kB; revisit with code-splitting when charts arrive
