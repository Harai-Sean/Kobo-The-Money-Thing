# Status

_Update this file at the end of every work session. Paste it into a new chat to resume quickly._

## Done

- Project scaffold: Vite, React, TypeScript strict, Tailwind v4, Router, TanStack Query, Zod
- Environment validation (`src/lib/env.ts`) with tests
- CI workflow, Dependabot, PR template
- Database migration `0001` (schema, RLS, signup trigger) and RLS check script

## Next

1. Apply the migration in Supabase, create two test users, run `supabase/tests/rls_check.sql`
2. Login, session guard, logout, change password
3. Money and date utilities with tests, then the quick-add parser

## Decisions

- ADR-001: Supabase directly, no offline in v0.1 (docs/adr)
- Naira only, light theme first, invite-only accounts, no "reset month" (months are views)
